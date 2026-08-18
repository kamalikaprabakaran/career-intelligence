from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.skill import SkillCreate

router = APIRouter(
    prefix="/users",
    tags=["Skills"]
)


@router.post("/{user_id}/skills")
def add_skill(user_id: str, skill: SkillCreate):

    # Check whether user exists
    user_response = (
        supabase
        .table("users")
        .select("id")
        .eq("id", user_id)
        .execute()
    )

    if not user_response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Insert skill
    response = (
        supabase
        .table("user_skills")
        .insert({
            "user_id": user_id,
            "skill_name": skill.skill_name,
            "proficiency": skill.proficiency,
            "years_experience": skill.years_experience
        })
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to add skill"
        )

    return response.data[0]


@router.get("/{user_id}/skills")
def get_user_skills(user_id: str):

    response = (
        supabase
        .table("user_skills")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )

    return response.data