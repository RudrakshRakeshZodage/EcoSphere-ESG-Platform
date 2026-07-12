import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.supabase_client import get_supabase_client
from app.config import get_settings

def create_user(email, password, full_name, role, department_name):
    supabase = get_supabase_client()
    
    # 1. Fetch department ID
    dept_res = supabase.table("departments").select("id").eq("name", department_name).execute()
    if not dept_res.data:
        print(f"Error: Department '{department_name}' not found.")
        return
    dept_id = dept_res.data[0]["id"]
    
    print(f"Creating user {email} ({role}) in department {department_name}...")
    
    # 2. Create or handle existing user
    user_id = None
    try:
        # Create user via admin API with email auto-confirmed
        user_res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": role,
                "department_id": dept_id
            }
        })
        user_id = user_res.user.id
        print(f"Successfully created auth user: {user_id}")
    except Exception as e:
        print(f"Note: User creation failed/skipped (user may already exist): {e}")
        # Fallback: Query profile by email to get user_id
        try:
            profile_res = supabase.table("profiles").select("id").eq("email", email).execute()
            if profile_res.data:
                user_id = profile_res.data[0]["id"]
                print(f"Found existing profile ID: {user_id}")
        except Exception as pe:
            print(f"Error querying existing profile: {pe}")

    if not user_id:
        print("Skipping profile update because user ID could not be determined.")
        return

    # 3. Explicitly update the profile to ensure role and department_id match
    try:
        profile_update = supabase.table("profiles").update({
            "full_name": full_name,
            "role": role,
            "department_id": dept_id
        }).eq("id", user_id).execute()
        print(f"Profile updated successfully: {profile_update.data}")
    except Exception as e:
        print(f"Failed to update profile: {e}")

if __name__ == "__main__":
    # Create an Admin user
    create_user(
        email="admin@ecosphere.com",
        password="Password123",
        full_name="EcoSphere Admin",
        role="admin",
        department_name="Engineering"
    )
    print("-" * 50)
    # Create an Employee user
    create_user(
        email="employee@ecosphere.com",
        password="Password123",
        full_name="Jane Employee",
        role="employee",
        department_name="Engineering"
    )
