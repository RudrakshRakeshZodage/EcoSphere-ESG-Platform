from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


# --- Pydantic Schemas ---

class CSRActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    department_id: Optional[str] = None
    date: Optional[date] = None
    max_participants: Optional[int] = None
    points_reward: int = 0
    status: str = "Active"


class ParticipationCreate(BaseModel):
    activity_id: str
    proof_url: Optional[str] = None
    completion_date: Optional[date] = None


class ParticipationApproval(BaseModel):
    approval_status: str  # 'Approved' or 'Rejected'


# --- CSR Activities ---

@router.get("/csr-activities")
async def list_csr_activities(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("csr_activities").select(
        "*, categories(name), departments(name)"
    ).order("date", desc=True).execute()
    return {"data": result.data}


@router.post("/csr-activities")
async def create_csr_activity(activity: CSRActivityCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    data = activity.model_dump(exclude_none=True)
    if "date" in data and data["date"]:
        data["date"] = str(data["date"])
    result = supabase.table("csr_activities").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/csr-activities/{activity_id}")
async def update_csr_activity(activity_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("csr_activities").update(updates).eq("id", activity_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/csr-activities/{activity_id}")
async def delete_csr_activity(activity_id: str, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    supabase.table("csr_activities").delete().eq("id", activity_id).execute()
    return {"message": "CSR activity deleted"}


# --- Employee Participations ---

@router.get("/participations")
async def list_participations(
    activity_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("employee_participations").select(
        "*, profiles(full_name, email), csr_activities(title)"
    )
    if activity_id:
        query = query.eq("activity_id", activity_id)
    result = query.order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/participations")
async def create_participation(
    participation: ParticipationCreate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()

    # Check if evidence is required
    settings_result = supabase.table("esg_settings").select("evidence_required").eq("id", 1).execute()
    evidence_required = settings_result.data[0]["evidence_required"] if settings_result.data else False

    if evidence_required and not participation.proof_url:
        raise HTTPException(
            status_code=400,
            detail="Evidence (proof file) is required for participation"
        )

    data = participation.model_dump(exclude_none=True)
    data["employee_id"] = current_user["id"]
    if "completion_date" in data and data["completion_date"]:
        data["completion_date"] = str(data["completion_date"])

    result = supabase.table("employee_participations").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/participations/{participation_id}/approve")
async def approve_participation(
    participation_id: str,
    approval: ParticipationApproval,
    current_user: dict = Depends(require_admin),
):
    """Approve or reject a participation (admin only)."""
    supabase = get_supabase_client()

    # Get the participation and its activity
    part_result = supabase.table("employee_participations").select(
        "*, csr_activities(points_reward)"
    ).eq("id", participation_id).execute()

    if not part_result.data:
        raise HTTPException(status_code=404, detail="Participation not found")

    participation_data = part_result.data[0]
    points = 0

    if approval.approval_status == "Approved":
        points = participation_data.get("csr_activities", {}).get("points_reward", 0)

    # Update participation
    update_data = {
        "approval_status": approval.approval_status,
        "points_earned": points,
        "reviewed_by": current_user["id"],
    }
    supabase.table("employee_participations").update(update_data).eq("id", participation_id).execute()

    # If approved, add points/XP to employee profile
    if approval.approval_status == "Approved" and points > 0:
        employee_id = participation_data["employee_id"]
        profile = supabase.table("profiles").select("xp, points").eq("id", employee_id).execute()
        if profile.data:
            current_xp = profile.data[0].get("xp", 0)
            current_points = profile.data[0].get("points", 0)
            supabase.table("profiles").update({
                "xp": current_xp + points,
                "points": current_points + points,
            }).eq("id", employee_id).execute()

        # Create notification
        supabase.table("notifications").insert({
            "user_id": employee_id,
            "title": "Participation Approved!",
            "message": f"Your CSR participation has been approved. You earned {points} points!",
            "type": "approval",
        }).execute()

    return {"message": f"Participation {approval.approval_status.lower()}"}


# --- Diversity Metrics ---

@router.get("/diversity")
async def diversity_metrics(current_user: dict = Depends(get_current_user)):
    """Get diversity metrics across departments."""
    supabase = get_supabase_client()

    # Get department stats
    departments = supabase.table("departments").select("name, employee_count").eq("status", "Active").execute()

    # Get participation stats per department
    participations = supabase.table("employee_participations").select(
        "profiles(department_id)"
    ).eq("approval_status", "Approved").execute()

    return {
        "data": {
            "departments": departments.data,
            "total_employees": sum(d.get("employee_count", 0) for d in departments.data),
            "total_participations": len(participations.data),
        }
    }
