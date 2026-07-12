from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    type: str  # 'CSR Activity' or 'Challenge'
    status: str = "Active"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


@router.get("")
async def list_categories(
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List categories, optionally filtered by type."""
    supabase = get_supabase_client()
    query = supabase.table("categories").select("*")
    if type:
        query = query.eq("type", type)
    result = query.order("name").execute()
    return {"data": result.data}


@router.post("")
async def create_category(cat: CategoryCreate, current_user: dict = Depends(require_admin)):
    """Create a new category (admin only)."""
    supabase = get_supabase_client()
    result = supabase.table("categories").insert(cat.model_dump()).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/{category_id}")
async def update_category(
    category_id: str,
    cat: CategoryUpdate,
    current_user: dict = Depends(require_admin),
):
    """Update a category (admin only)."""
    supabase = get_supabase_client()
    updates = cat.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("categories").update(updates).eq("id", category_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(require_admin)):
    """Delete a category (admin only)."""
    supabase = get_supabase_client()
    supabase.table("categories").delete().eq("id", category_id).execute()
    return {"message": "Category deleted"}
