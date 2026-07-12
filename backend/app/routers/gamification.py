from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


# --- Pydantic Schemas ---

class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    xp_reward: int = 0
    difficulty: str = "Medium"
    evidence_required: bool = False
    deadline: Optional[date] = None
    status: str = "Draft"


class ChallengeParticipationCreate(BaseModel):
    challenge_id: str
    proof_url: Optional[str] = None


class BadgeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    unlock_rule: dict  # e.g., {"type": "xp_threshold", "value": 500}
    status: str = "Active"


class RewardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    points_required: int
    stock: int = 0
    status: str = "Active"


# --- Challenges ---

@router.get("/challenges")
async def list_challenges(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("challenges").select("*, categories(name)")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/challenges")
async def create_challenge(challenge: ChallengeCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    data = challenge.model_dump(exclude_none=True)
    data["created_by"] = current_user["id"]
    if "deadline" in data and data["deadline"]:
        data["deadline"] = str(data["deadline"])
    result = supabase.table("challenges").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/challenges/{challenge_id}")
async def update_challenge(challenge_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("challenges").update(updates).eq("id", challenge_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/challenges/{challenge_id}/status")
async def update_challenge_status(
    challenge_id: str,
    new_status: str,
    current_user: dict = Depends(require_admin),
):
    """Update challenge status through its lifecycle: Draft → Active → Under Review → Completed / Archived."""
    valid_transitions = {
        "Draft": ["Active", "Archived"],
        "Active": ["Under Review", "Archived"],
        "Under Review": ["Completed", "Archived"],
        "Completed": ["Archived"],
    }
    supabase = get_supabase_client()
    challenge = supabase.table("challenges").select("status").eq("id", challenge_id).execute()
    if not challenge.data:
        raise HTTPException(status_code=404, detail="Challenge not found")

    current_status = challenge.data[0]["status"]
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current_status}' to '{new_status}'"
        )

    result = supabase.table("challenges").update({"status": new_status}).eq("id", challenge_id).execute()
    return {"data": result.data[0] if result.data else None}


# --- Challenge Participations ---

@router.get("/challenge-participations")
async def list_challenge_participations(
    challenge_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("challenge_participations").select(
        "*, profiles(full_name, email), challenges(title, xp_reward)"
    )
    if challenge_id:
        query = query.eq("challenge_id", challenge_id)
    result = query.order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/challenge-participations")
async def join_challenge(
    participation: ChallengeParticipationCreate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()

    # Check if challenge is Active
    challenge = supabase.table("challenges").select("status, evidence_required").eq(
        "id", participation.challenge_id
    ).execute()
    if not challenge.data or challenge.data[0]["status"] != "Active":
        raise HTTPException(status_code=400, detail="Challenge is not active")

    data = {
        "challenge_id": participation.challenge_id,
        "employee_id": current_user["id"],
        "proof_url": participation.proof_url,
    }
    result = supabase.table("challenge_participations").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/challenge-participations/{cp_id}/approve")
async def approve_challenge_participation(
    cp_id: str,
    approval_status: str,
    current_user: dict = Depends(require_admin),
):
    """Approve or reject a challenge participation."""
    supabase = get_supabase_client()

    cp = supabase.table("challenge_participations").select(
        "*, challenges(xp_reward)"
    ).eq("id", cp_id).execute()

    if not cp.data:
        raise HTTPException(status_code=404, detail="Participation not found")

    xp = 0
    if approval_status == "Approved":
        xp = cp.data[0].get("challenges", {}).get("xp_reward", 0)

    supabase.table("challenge_participations").update({
        "approval_status": approval_status,
        "xp_awarded": xp,
        "completed_at": str(date.today()) if approval_status == "Approved" else None,
    }).eq("id", cp_id).execute()

    # Award XP if approved
    if approval_status == "Approved" and xp > 0:
        employee_id = cp.data[0]["employee_id"]
        profile = supabase.table("profiles").select("xp, points").eq("id", employee_id).execute()
        if profile.data:
            supabase.table("profiles").update({
                "xp": profile.data[0].get("xp", 0) + xp,
                "points": profile.data[0].get("points", 0) + xp,
            }).eq("id", employee_id).execute()

        # Check badge auto-award
        await _check_badge_auto_award(employee_id, supabase)

        # Notification
        supabase.table("notifications").insert({
            "user_id": employee_id,
            "title": "Challenge Completed!",
            "message": f"Your challenge participation has been approved. You earned {xp} XP!",
            "type": "approval",
        }).execute()

    return {"message": f"Participation {approval_status.lower()}"}


async def _check_badge_auto_award(employee_id: str, supabase):
    """Check if employee qualifies for any badges and auto-award them."""
    settings = supabase.table("esg_settings").select("badge_auto_award").eq("id", 1).execute()
    if not settings.data or not settings.data[0].get("badge_auto_award"):
        return

    profile = supabase.table("profiles").select("xp").eq("id", employee_id).execute()
    if not profile.data:
        return

    current_xp = profile.data[0].get("xp", 0)

    # Count completed challenges
    completed = supabase.table("challenge_participations").select("id").eq(
        "employee_id", employee_id
    ).eq("approval_status", "Approved").execute()
    completed_count = len(completed.data)

    # Get all active badges
    badges = supabase.table("badges").select("*").eq("status", "Active").execute()

    # Get already earned badges
    earned = supabase.table("employee_badges").select("badge_id").eq("employee_id", employee_id).execute()
    earned_ids = {b["badge_id"] for b in earned.data}

    for badge in badges.data:
        if badge["id"] in earned_ids:
            continue

        rule = badge.get("unlock_rule", {})
        rule_type = rule.get("type", "")
        rule_value = rule.get("value", 0)

        qualified = False
        if rule_type == "xp_threshold" and current_xp >= rule_value:
            qualified = True
        elif rule_type == "challenge_count" and completed_count >= rule_value:
            qualified = True

        if qualified:
            supabase.table("employee_badges").insert({
                "employee_id": employee_id,
                "badge_id": badge["id"],
            }).execute()

            supabase.table("notifications").insert({
                "user_id": employee_id,
                "title": "Badge Unlocked! 🏆",
                "message": f"Congratulations! You've earned the '{badge['name']}' badge!",
                "type": "badge",
            }).execute()


# --- Badges ---

@router.get("/badges")
async def list_badges(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("badges").select("*").order("name").execute()
    return {"data": result.data}


@router.get("/badges/my")
async def my_badges(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("employee_badges").select(
        "*, badges(*)"
    ).eq("employee_id", current_user["id"]).execute()
    return {"data": result.data}


@router.post("/badges")
async def create_badge(badge: BadgeCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("badges").insert(badge.model_dump()).execute()
    return {"data": result.data[0] if result.data else None}


# --- Rewards ---

@router.get("/rewards")
async def list_rewards(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("rewards").select("*").eq("status", "Active").order("points_required").execute()
    return {"data": result.data}


@router.post("/rewards")
async def create_reward(reward: RewardCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("rewards").insert(reward.model_dump()).execute()
    return {"data": result.data[0] if result.data else None}


@router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(reward_id: str, current_user: dict = Depends(get_current_user)):
    """Redeem a reward using points."""
    supabase = get_supabase_client()

    # Get reward
    reward = supabase.table("rewards").select("*").eq("id", reward_id).execute()
    if not reward.data:
        raise HTTPException(status_code=404, detail="Reward not found")

    reward_data = reward.data[0]
    if reward_data["stock"] <= 0:
        raise HTTPException(status_code=400, detail="Reward out of stock")

    # Check user points
    user_points = current_user.get("points", 0)
    if user_points < reward_data["points_required"]:
        raise HTTPException(status_code=400, detail="Not enough points")

    # Deduct points
    supabase.table("profiles").update({
        "points": user_points - reward_data["points_required"]
    }).eq("id", current_user["id"]).execute()

    # Reduce stock
    supabase.table("rewards").update({
        "stock": reward_data["stock"] - 1
    }).eq("id", reward_id).execute()

    # Record redemption
    supabase.table("reward_redemptions").insert({
        "employee_id": current_user["id"],
        "reward_id": reward_id,
        "points_spent": reward_data["points_required"],
    }).execute()

    return {"message": "Reward redeemed successfully!"}


# --- Leaderboard ---

@router.get("/leaderboard")
async def leaderboard(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("profiles").select(
        "id, full_name, avatar_url, xp, points, department_id, departments(name)"
    ).order("xp", desc=True).limit(50).execute()
    return {"data": result.data}
