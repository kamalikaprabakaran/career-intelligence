"""
Everything related to the `users` table lives here.
This is the endpoint from Step 7 of the roadmap:
POST /users -> row should appear in Supabase.
"""

from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate):
    """Create a new user row in Supabase."""
    try:
        result = supabase.table("users").insert(user.model_dump()).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Supabase error: {error}")

    if not result.data:
        raise HTTPException(status_code=500, detail="User was not created")

    return result.data[0]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    """Fetch a single user by id - useful to confirm Step 7 worked."""
    result = supabase.table("users").select("*").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]


@router.get("", response_model=list[UserResponse])
def list_users():
    """List all users - handy for quick manual testing."""
    result = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return result.data