from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ESGSettingsUpdate(BaseModel):
    env_weight: Optional[float] = None
    social_weight: Optional[float] = None
    gov_weight: Optional[float] = None
    auto_emission_enabled: Optional[bool] = None
    evidence_required: Optional[bool] = None
    badge_auto_award: Optional[bool] = None
    notification_email: Optional[bool] = None
    notification_in_app: Optional[bool] = None


@router.get("")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Get current ESG settings."""
    supabase = get_supabase_client()
    result = supabase.table("esg_settings").select("*").eq("id", 1).execute()

    if not result.data:
        # Create default settings if none exist
        default = {
            "id": 1,
            "env_weight": 0.40,
            "social_weight": 0.30,
            "gov_weight": 0.30,
            "auto_emission_enabled": False,
            "evidence_required": False,
            "badge_auto_award": True,
            "notification_email": False,
            "notification_in_app": True,
        }
        supabase.table("esg_settings").insert(default).execute()
        return {"data": default}

    return {"data": result.data[0]}


@router.put("")
async def update_settings(
    settings: ESGSettingsUpdate,
    current_user: dict = Depends(require_admin),
):
    """Update ESG settings (admin only)."""
    supabase = get_supabase_client()
    updates = settings.model_dump(exclude_none=True)

    # Validate weights sum to 1.0 if any weight is being updated
    if any(k in updates for k in ("env_weight", "social_weight", "gov_weight")):
        current = supabase.table("esg_settings").select("*").eq("id", 1).execute()
        current_data = current.data[0] if current.data else {}

        env_w = updates.get("env_weight", current_data.get("env_weight", 0.40))
        social_w = updates.get("social_weight", current_data.get("social_weight", 0.30))
        gov_w = updates.get("gov_weight", current_data.get("gov_weight", 0.30))

        if abs((env_w + social_w + gov_w) - 1.0) > 0.01:
            raise HTTPException(
                status_code=400,
                detail="ESG weights must sum to 1.0 (100%)"
            )

    result = supabase.table("esg_settings").update(updates).eq("id", 1).execute()
    return {"data": result.data[0] if result.data else None}
