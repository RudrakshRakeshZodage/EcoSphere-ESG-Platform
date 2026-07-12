from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


# --- Pydantic Schemas ---

class EmissionFactorCreate(BaseModel):
    source_type: str
    description: Optional[str] = None
    factor_value: float
    unit: str
    region: Optional[str] = None
    status: str = "Active"


class CarbonTransactionCreate(BaseModel):
    department_id: str
    emission_factor_id: str
    source_type: str
    quantity: float
    date: date
    notes: Optional[str] = None


class EnvironmentalGoalCreate(BaseModel):
    department_id: Optional[str] = None
    title: str
    target_value: float
    current_value: float = 0
    unit: str
    deadline: Optional[date] = None
    status: str = "Active"


# --- Emission Factors ---

@router.get("/emission-factors")
async def list_emission_factors(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("emission_factors").select("*").order("source_type").execute()
    return {"data": result.data}


@router.post("/emission-factors")
async def create_emission_factor(ef: EmissionFactorCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("emission_factors").insert(ef.model_dump(exclude_none=True)).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/emission-factors/{ef_id}")
async def update_emission_factor(ef_id: str, ef: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("emission_factors").update(ef).eq("id", ef_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/emission-factors/{ef_id}")
async def delete_emission_factor(ef_id: str, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    supabase.table("emission_factors").delete().eq("id", ef_id).execute()
    return {"message": "Emission factor deleted"}


# --- Carbon Transactions ---

@router.get("/carbon-transactions")
async def list_carbon_transactions(
    department_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("carbon_transactions").select("*, departments(name), emission_factors(source_type, unit)")
    if department_id:
        query = query.eq("department_id", department_id)
    if date_from:
        query = query.gte("date", date_from)
    if date_to:
        query = query.lte("date", date_to)
    result = query.order("date", desc=True).execute()
    return {"data": result.data}


@router.post("/carbon-transactions")
async def create_carbon_transaction(
    ct: CarbonTransactionCreate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()

    # Check if auto-emission is enabled
    settings_result = supabase.table("esg_settings").select("auto_emission_enabled").eq("id", 1).execute()
    auto_enabled = settings_result.data[0]["auto_emission_enabled"] if settings_result.data else False

    # Get emission factor value
    ef_result = supabase.table("emission_factors").select("factor_value").eq("id", ct.emission_factor_id).execute()
    if not ef_result.data:
        raise HTTPException(status_code=404, detail="Emission factor not found")

    factor_value = ef_result.data[0]["factor_value"]
    calculated_emission = ct.quantity * factor_value

    data = ct.model_dump()
    data["date"] = str(data["date"])
    data["calculated_emission"] = calculated_emission
    data["auto_calculated"] = auto_enabled

    result = supabase.table("carbon_transactions").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/carbon-transactions/{ct_id}")
async def delete_carbon_transaction(ct_id: str, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    supabase.table("carbon_transactions").delete().eq("id", ct_id).execute()
    return {"message": "Carbon transaction deleted"}


# --- Environmental Goals ---

@router.get("/goals")
async def list_goals(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("environmental_goals").select("*, departments(name)").order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/goals")
async def create_goal(goal: EnvironmentalGoalCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    data = goal.model_dump(exclude_none=True)
    if "deadline" in data and data["deadline"]:
        data["deadline"] = str(data["deadline"])
    result = supabase.table("environmental_goals").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("environmental_goals").update(updates).eq("id", goal_id).execute()
    return {"data": result.data[0] if result.data else None}


# --- Environmental Dashboard ---

@router.get("/dashboard")
async def environmental_dashboard(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()

    # Total emissions
    emissions = supabase.table("carbon_transactions").select("calculated_emission, date, source_type").execute()

    # Goals
    goals = supabase.table("environmental_goals").select("*").execute()

    # Aggregate emissions by source type
    by_source = {}
    total_emissions = 0
    for e in emissions.data:
        src = e["source_type"]
        val = e["calculated_emission"] or 0
        by_source[src] = by_source.get(src, 0) + val
        total_emissions += val

    # Goals progress
    active_goals = [g for g in goals.data if g["status"] == "Active"]
    completed_goals = [g for g in goals.data if g["current_value"] >= g["target_value"]]

    return {
        "data": {
            "total_emissions": round(total_emissions, 2),
            "emissions_by_source": by_source,
            "total_goals": len(goals.data),
            "active_goals": len(active_goals),
            "completed_goals": len(completed_goals),
            "goals": goals.data,
            "recent_transactions": emissions.data[:10],
        }
    }
