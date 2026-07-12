from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatQuery(BaseModel):
    message: str


@router.post("/query")
async def chat_query(query: ChatQuery, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    msg = query.message.lower().strip()
    
    # 1. Load context in real-time
    profiles = supabase.table("profiles").select("*, departments(name)").execute().data or []
    products = supabase.table("product_esg_profiles").select("*").execute().data or []
    issues = supabase.table("compliance_issues").select("*, profiles(full_name)").execute().data or []
    csr = supabase.table("csr_activities").select("*").execute().data or []
    transactions = supabase.table("carbon_transactions").select("*").execute().data or []

    # 2. Dynamic matching logic
    # Check for specific user query
    for p in profiles:
        name = p.get("full_name", "").lower()
        if name in msg and len(name) > 3:
            dept = p.get("departments", {}).get("name", "N/A") if p.get("departments") else "N/A"
            return {
                "answer": f"👤 **Employee Profile Found (Real-Time):**\n• Name: **{p['full_name']}**\n• Email: {p['email']}\n• Role: {p['role'].capitalize()}\n• Department: {dept}\n• Score: **{p['xp']} XP**\n• Redeemable Balance: **{p['points']} points**"
            }

    # Check for specific product query
    for pr in products:
        p_name = pr.get("product_name", "").lower()
        if p_name in msg or (len(p_name.split()) > 1 and any(word in msg for word in p_name.split() if len(word) > 3)):
            return {
                "answer": f"📦 **Product ESG Profile Found (Real-Time):**\n• Name: **{pr['product_name']}**\n• Carbon Footprint: **{pr['carbon_footprint']} kg CO2e**\n• Recyclability Score: **{pr['recyclability_score']}%**\n• Sustainability Rating: **{pr['sustainability_rating']}**\n• Notes: {pr.get('notes', 'No notes')}"
            }

    # Check for aggregate carbon queries
    if any(k in msg for k in ["total emission", "carbon emission", "co2", "carbon footprint", "transaction"]):
        total_emissions = sum(float(t.get("calculated_emission", 0)) for t in transactions)
        avg_emissions = total_emissions / len(transactions) if transactions else 0
        return {
            "answer": f"🌱 **Carbon Transaction Analytics (Real-Time):**\n• Total transactions logged: **{len(transactions)}**\n• Total corporate emissions: **{total_emissions:.2f} kg CO2e**\n• Average emission/transaction: **{avg_emissions:.2f} kg CO2e**"
        }

    # Check for compliance / governance queries
    if any(k in msg for k in ["compliance", "issue", "violations", "audit"]):
        open_issues = [i for i in issues if i.get("status") != "Resolved"]
        if open_issues:
            details = "\n".join([f"• **[{i['severity']}]** {i['description']} (Owner: {i.get('profiles', {}).get('full_name', 'Unassigned')}, Due: {i['due_date']})" for i in open_issues])
            return {
                "answer": f"⚠️ **Open Compliance Issues ({len(open_issues)} found in real-time):**\n\n{details}"
            }
        return {
            "answer": "✅ **Compliance Audit:** All compliance issues are currently resolved in our database."
        }

    # Check for CSR / social queries
    if any(k in msg for k in ["csr", "activities", "volunteer", "social"]):
        active_csr = [c for c in csr if c.get("status") == "Active"]
        if active_csr:
            details = "\n".join([f"• **{c['title']}** (Reward: {c['points_reward']} XP, Date: {c['date']})" for c in active_csr])
            return {
                "answer": f"🤝 **Active CSR Activities ({len(active_csr)} found in real-time):**\n\n{details}"
            }
        return {
            "answer": "No active CSR campaigns currently running."
        }

    # Default fallback - general ESG guide
    return {
        "answer": "I'm **EcoBot**, your real-time ESG Advisor. I search all tables in your Supabase database on the fly.\n\nTry asking me:\n• *'What is the footprint of Biodegradable Phone Case?'*\n• *'Show me Nidhi\\'s XP score'* \n• *'List open compliance issues'* \n• *'What are our total emissions?'*"
    }
