from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


# --- Pydantic Schemas ---

class PolicyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    version: str = "1.0"
    effective_date: Optional[date] = None
    status: str = "Active"
    document_url: Optional[str] = None


class AuditCreate(BaseModel):
    title: str
    department_id: Optional[str] = None
    auditor: Optional[str] = None
    audit_date: Optional[date] = None
    findings: Optional[str] = None
    status: str = "Planned"


class ComplianceIssueCreate(BaseModel):
    audit_id: Optional[str] = None
    severity: str
    description: str
    owner_id: str
    due_date: date
    status: str = "Open"


# --- Policies ---

@router.get("/policies")
async def list_policies(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("esg_policies").select("*").order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/policies")
async def create_policy(policy: PolicyCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    data = policy.model_dump(exclude_none=True)
    if "effective_date" in data and data["effective_date"]:
        data["effective_date"] = str(data["effective_date"])
    result = supabase.table("esg_policies").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/policies/{policy_id}")
async def update_policy(policy_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("esg_policies").update(updates).eq("id", policy_id).execute()
    return {"data": result.data[0] if result.data else None}


@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    supabase.table("esg_policies").delete().eq("id", policy_id).execute()
    return {"message": "Policy deleted"}


# --- Policy Acknowledgements ---

@router.get("/policy-acknowledgements")
async def list_acknowledgements(
    policy_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("policy_acknowledgements").select(
        "*, profiles(full_name, email), esg_policies(title)"
    )
    if policy_id:
        query = query.eq("policy_id", policy_id)
    result = query.order("acknowledged_at", desc=True).execute()
    return {"data": result.data}


@router.post("/policy-acknowledgements")
async def acknowledge_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Acknowledge a policy."""
    supabase = get_supabase_client()
    data = {
        "policy_id": policy_id,
        "employee_id": current_user["id"],
    }
    try:
        result = supabase.table("policy_acknowledgements").insert(data).execute()
        return {"data": result.data[0] if result.data else None}
    except Exception:
        raise HTTPException(status_code=400, detail="Policy already acknowledged")


# --- Audits ---

@router.get("/audits")
async def list_audits(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("audits").select("*, departments(name)").order("audit_date", desc=True).execute()
    return {"data": result.data}


@router.post("/audits")
async def create_audit(audit: AuditCreate, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    data = audit.model_dump(exclude_none=True)
    if "audit_date" in data and data["audit_date"]:
        data["audit_date"] = str(data["audit_date"])
    result = supabase.table("audits").insert(data).execute()
    return {"data": result.data[0] if result.data else None}


@router.put("/audits/{audit_id}")
async def update_audit(audit_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    result = supabase.table("audits").update(updates).eq("id", audit_id).execute()
    return {"data": result.data[0] if result.data else None}


# --- Compliance Issues ---

@router.get("/compliance-issues")
async def list_compliance_issues(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    query = supabase.table("compliance_issues").select(
        "*, audits(title), profiles(full_name)"
    )
    if severity:
        query = query.eq("severity", severity)
    if status:
        query = query.eq("status", status)
    result = query.order("due_date").execute()

    # Flag overdue issues
    from datetime import date as date_type
    today = str(date_type.today())
    for issue in result.data:
        if issue["status"] == "Open" and issue["due_date"] and issue["due_date"] < today:
            issue["is_overdue"] = True
            # Update status to Overdue in DB
            supabase.table("compliance_issues").update(
                {"status": "Overdue"}
            ).eq("id", issue["id"]).eq("status", "Open").execute()
        else:
            issue["is_overdue"] = False

    return {"data": result.data}


@router.post("/compliance-issues")
async def create_compliance_issue(
    issue: ComplianceIssueCreate,
    current_user: dict = Depends(require_admin),
):
    supabase = get_supabase_client()
    data = issue.model_dump()
    data["due_date"] = str(data["due_date"])
    result = supabase.table("compliance_issues").insert(data).execute()

    # Send notification to issue owner
    supabase.table("notifications").insert({
        "user_id": issue.owner_id,
        "title": "New Compliance Issue Assigned",
        "message": f"A {issue.severity} severity compliance issue has been assigned to you. Due: {issue.due_date}",
        "type": "compliance",
    }).execute()

    return {"data": result.data[0] if result.data else None}


@router.put("/compliance-issues/{issue_id}")
async def update_compliance_issue(
    issue_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_client()
    result = supabase.table("compliance_issues").update(updates).eq("id", issue_id).execute()
    return {"data": result.data[0] if result.data else None}
