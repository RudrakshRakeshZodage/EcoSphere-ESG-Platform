from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import get_supabase_client

from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    department_id: Optional[str] = None


@router.post("/signup")
async def signup_user(req: SignupRequest):
    """Register a new user and auto-confirm email using Admin Auth client."""
    supabase = get_supabase_client()
    
    # Check if a user with this email already exists in the profiles table
    existing_profile = supabase.table("profiles").select("id").eq("email", req.email).execute()
    if existing_profile.data and len(existing_profile.data) > 0:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    
    user_data = {
        "email": req.email,
        "password": req.password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": req.full_name,
            "role": req.role,
            "department_id": req.department_id
        }
    }
    
    try:
        res = supabase.auth.admin.create_user(user_data)
        if not res.user:
            raise HTTPException(status_code=400, detail="Failed to create user account")
        return {"message": "Account created successfully", "userId": res.user.id}
    except Exception as e:
        err_msg = str(e)
        if "already exists" in err_msg or "already registered" in err_msg:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        raise HTTPException(status_code=400, detail=f"Signup failed: {err_msg}")



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
