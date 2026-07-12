from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ProductESGProfileCreate(BaseModel):
    product_name: str
    carbon_footprint: Optional[float] = None
    recyclability_score: Optional[float] = None
    sustainability_rating: Optional[str] = None
    notes: Optional[str] = None


class ProductESGProfileUpdate(BaseModel):
    product_name: Optional[str] = None
    carbon_footprint: Optional[float] = None
    recyclability_score: Optional[float] = None
    sustainability_rating: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
async def list_products(current_user: dict = Depends(get_current_user)):
    """List all product ESG profiles."""
    supabase = get_supabase_client()
    result = supabase.table("product_esg_profiles").select("*").order("product_name").execute()
    return {"data": result.data}


@router.post("")
async def create_product(
    product: ProductESGProfileCreate,
    current_user: dict = Depends(require_admin),
):
    """Create a new product ESG profile (admin only)."""
    supabase = get_supabase_client()
    result = supabase.table("product_esg_profiles").insert(product.model_dump()).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    product: ProductESGProfileUpdate,
    current_user: dict = Depends(require_admin),
):
    """Update a product ESG profile (admin only)."""
    supabase = get_supabase_client()
    updates = product.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("product_esg_profiles").update(updates).eq("id", product_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(require_admin)):
    """Delete a product ESG profile (admin only)."""
    supabase = get_supabase_client()
    result = supabase.table("product_esg_profiles").delete().eq("id", product_id).execute()
    return {"message": "Product profile deleted successfully"}
