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
    # Check for user count queries
    if any(k in msg for k in ["how many users", "number of users", "total users", "all users", "count of users", "how many employees", "total employees"]):
        names = "\n".join([f"• **{p['full_name']}** ({p['email']}) - {p['xp']} XP" for p in profiles])
        return {
            "answer": f"👥 **EcoSphere Database Users (Real-Time):**\nWe have **{len(profiles)} registered users** in our system:\n\n{names}"
        }

    # Check for specific user queries (fuzzy/partial matching)
    for p in profiles:
        name = p.get("full_name", "").lower()
        # Split names or match substring/prefixes
        matched = False
        if name in msg:
            matched = True
        elif "rudraksh" in msg and "rudraksh" in name:
            matched = True
        elif "nidhi" in msg and "nidhi" in name:
            matched = True
        else:
            # Check if any word in the full name matches a word in the message
            parts = name.replace("@", " ").replace(".", " ").split()
            if any(part in msg for part in parts if len(part) >= 4):
                matched = True

        if matched:
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
    if any(k in msg for k in ["total emission", "carbon emission", "co2", "carbon footprint", "transaction", "emissions"]):
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

    # Check for general ESG definitions
    if any(k in msg for k in ["what is esg", "define esg", "meaning of esg", "about esg", "esg stand for", "esg meaning"]):
        return {
            "answer": "**ESG** stands for **Environmental, Social, and Governance**.\n\n• **Environmental**: How a company safeguards the environment (e.g., carbon emissions, waste).\n• **Social**: How it manages relationships with employees, suppliers, customers, and communities.\n• **Governance**: Deals with a company’s leadership, executive pay, audits, internal controls, and shareholder rights.\n\nEcoSphere helps you track and improve all these metrics!"
        }
        
    # Check for greetings or help
    if msg in ["hi", "hello", "hey", "help", "what can you do"]:
        return {
            "answer": "Hello! I am EcoBot, your real-time ESG Advisor. You can ask me things like:\n• 'What is my score?' (or just type your name)\n• 'How many users are there?'\n• 'Show me carbon emissions'\n• 'Are there any compliance issues?'\n• 'What is ESG?'"
        }

    # Default fallback
    return {
        "answer": "I'm not quite sure how to answer that yet! I am currently a keyword-based assistant. Try asking me about 'carbon emissions', 'compliance issues', 'CSR activities', or type an employee's name to see their profile."
    }
