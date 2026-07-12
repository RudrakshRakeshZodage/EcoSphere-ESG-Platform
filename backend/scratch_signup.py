from app.supabase_client import get_supabase_anon_client
import sys

client = get_supabase_anon_client()
try:
    res = client.auth.sign_up({
        "email": "edupulse.work@gmail.com",
        "password": "Password123",
        "options": {
            "data": {
                "full_name": "ADMIN",
                "role": "admin"
            }
        }
    })
    print("Signup Response:", res)
except Exception as e:
    print("Signup Error:", e, file=sys.stderr)
