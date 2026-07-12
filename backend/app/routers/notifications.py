from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.supabase_client import get_supabase_client

router = APIRouter()


@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """Get all notifications for the current user."""
    supabase = get_supabase_client()
    result = supabase.table("notifications").select("*").eq(
        "user_id", current_user["id"]
    ).order("created_at", desc=True).limit(50).execute()
    return {"data": result.data}


@router.get("/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications."""
    supabase = get_supabase_client()
    result = supabase.table("notifications").select("id").eq(
        "user_id", current_user["id"]
    ).eq("is_read", False).execute()
    return {"count": len(result.data)}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    supabase = get_supabase_client()
    supabase.table("notifications").update({"is_read": True}).eq(
        "id", notification_id
    ).eq("user_id", current_user["id"]).execute()
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    supabase = get_supabase_client()
    supabase.table("notifications").update({"is_read": True}).eq(
        "user_id", current_user["id"]
    ).eq("is_read", False).execute()
    return {"message": "All notifications marked as read"}
