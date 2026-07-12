from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.supabase_client import get_supabase_client

router = APIRouter()


@router.get("")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get aggregated ESG dashboard data."""
    supabase = get_supabase_client()

    # Get ESG settings for weighting
    settings = supabase.table("esg_settings").select("*").eq("id", 1).execute()
    weights = settings.data[0] if settings.data else {
        "env_weight": 0.40, "social_weight": 0.30, "gov_weight": 0.30
    }

    # Department scores
    dept_scores = supabase.table("department_scores").select(
        "*, departments(name, code)"
    ).order("total_score", desc=True).execute()

    # Carbon transactions (recent)
    carbon = supabase.table("carbon_transactions").select(
        "calculated_emission, date, source_type"
    ).order("date", desc=True).limit(100).execute()

    # Total emissions
    total_emissions = sum(c.get("calculated_emission", 0) for c in carbon.data)

    # Active challenges
    challenges = supabase.table("challenges").select("id, status").execute()
    active_challenges = len([c for c in challenges.data if c["status"] == "Active"])

    # Compliance issues
    issues = supabase.table("compliance_issues").select("id, status, severity").execute()
    open_issues = len([i for i in issues.data if i["status"] in ("Open", "Overdue")])
    critical_issues = len([i for i in issues.data if i["severity"] == "Critical" and i["status"] != "Resolved"])

    # CSR activities
    activities = supabase.table("csr_activities").select("id").eq("status", "Active").execute()

    # Goals progress
    goals = supabase.table("environmental_goals").select("*").eq("status", "Active").execute()

    # Employee count
    profiles = supabase.table("profiles").select("id").execute()

    # Calculate overall ESG score
    env_weight = float(weights.get("env_weight", 0.40))
    social_weight = float(weights.get("social_weight", 0.30))
    gov_weight = float(weights.get("gov_weight", 0.30))

    # Average department scores
    if dept_scores.data:
        avg_env = sum(d.get("environmental_score", 0) for d in dept_scores.data) / len(dept_scores.data)
        avg_social = sum(d.get("social_score", 0) for d in dept_scores.data) / len(dept_scores.data)
        avg_gov = sum(d.get("governance_score", 0) for d in dept_scores.data) / len(dept_scores.data)
        overall_score = (avg_env * env_weight) + (avg_social * social_weight) + (avg_gov * gov_weight)
    else:
        avg_env = avg_social = avg_gov = overall_score = 0

    # Emission trend (last 12 months grouped)
    emission_trend = {}
    for c in carbon.data:
        month = c["date"][:7] if c.get("date") else "Unknown"
        emission_trend[month] = emission_trend.get(month, 0) + c.get("calculated_emission", 0)

    return {
        "data": {
            "overall_score": round(overall_score, 1),
            "environmental_score": round(avg_env, 1),
            "social_score": round(avg_social, 1),
            "governance_score": round(avg_gov, 1),
            "weights": {
                "environmental": env_weight,
                "social": social_weight,
                "governance": gov_weight,
            },
            "total_emissions": round(total_emissions, 2),
            "active_challenges": active_challenges,
            "total_challenges": len(challenges.data),
            "open_compliance_issues": open_issues,
            "critical_issues": critical_issues,
            "active_csr_activities": len(activities.data),
            "total_employees": len(profiles.data),
            "department_rankings": dept_scores.data,
            "emission_trend": emission_trend,
            "goals": goals.data,
        }
    }
