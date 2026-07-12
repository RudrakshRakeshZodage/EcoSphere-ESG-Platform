from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    code: str
    head_name: Optional[str] = None
    parent_department_id: Optional[str] = None
    employee_count: int = 0
    status: str = "Active"


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    head_name: Optional[str] = None
    parent_department_id: Optional[str] = None
    employee_count: Optional[int] = None
    status: Optional[str] = None


@router.get("")
async def list_departments(current_user: dict = Depends(get_current_user)):
    """List all departments."""
    supabase = get_supabase_client()
    result = supabase.table("departments").select("*").order("name").execute()
    return {"data": result.data}


@router.get("/{department_id}")
async def get_department(department_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single department by ID."""
    supabase = get_supabase_client()
    result = supabase.table("departments").select("*").eq("id", department_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"data": result.data[0]}


@router.post("")
async def create_department(dept: DepartmentCreate, current_user: dict = Depends(require_admin)):
    """Create a new department (admin only)."""
    supabase = get_supabase_client()
    result = supabase.table("departments").insert(dept.model_dump(exclude_none=True)).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/{department_id}")
async def update_department(
    department_id: str,
    dept: DepartmentUpdate,
    current_user: dict = Depends(require_admin),
):
    """Update a department (admin only)."""
    supabase = get_supabase_client()
    updates = dept.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("departments").update(updates).eq("id", department_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/{department_id}")
async def delete_department(department_id: str, current_user: dict = Depends(require_admin)):
    """Delete a department (admin only)."""
    supabase = get_supabase_client()
    supabase.table("departments").delete().eq("id", department_id).execute()
    return {"message": "Department deleted"}
