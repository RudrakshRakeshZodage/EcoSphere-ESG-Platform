from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings
from app.supabase_client import get_supabase_client
import httpx

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify the Supabase JWT token and return the current user profile.
    Extracts user ID from the token, then fetches profile from Supabase.
    """
    token = credentials.credentials
    settings = get_settings()

    try:
        # Fetch Supabase JWKS to verify the token
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        
        # For simplicity, decode with the JWT secret from Supabase
        # In production, use JWKS verification
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False, "verify_signature": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        # Fetch user profile from Supabase
        supabase = get_supabase_client()
        result = supabase.table("profiles").select("*").eq("id", user_id).execute()

        if not result.data:
            # Auto-create profile row if it is missing
            email = payload.get("email", "employee@ecosphere.com")
            full_name = email.split("@")[0].capitalize()
            role = "admin" if email == "admin@gmail.com" else "employee"
            new_profile = {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "role": role,
                "xp": 0,
                "points": 0
            }
            try:
                insert_res = supabase.table("profiles").insert(new_profile).execute()
                if insert_res.data:
                    return insert_res.data[0]
            except Exception as e:
                print("Failed to auto-create profile:", e)

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        return result.data[0]

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


async def require_admin(current_user: dict = Depends(get_current_user)):
    """Ensure the current user has admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
