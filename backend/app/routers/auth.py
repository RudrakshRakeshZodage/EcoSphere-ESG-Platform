from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    return {"data": current_user}


@router.put("/profile")
async def update_profile(
    updates: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    supabase = get_supabase_client()
    allowed_fields = ["full_name", "avatar_url", "department_id"]
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = supabase.table("profiles").update(filtered).eq("id", current_user["id"]).execute()
    return {"data": result.data[0] if result.data else None}
