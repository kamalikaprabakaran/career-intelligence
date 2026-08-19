"""
Exposes the skill-gap / match calculation as an API endpoint.
GET /match/{user_id}/{job_id} -> matched/missing/extra skills + match %
"""

from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.match import MatchResponse
from app.services.matching import calculate_match

router = APIRouter(
    prefix="/match",
    tags=["Matching"]
)


@router.get("/{user_id}/{job_id}", response_model=MatchResponse)
def get_match(user_id: str, job_id: str):
    # 1. Confirm the job exists and grab its title
    job_response = supabase.table("jobs").select("id, title").eq("id", job_id).execute()
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_response.data[0]

    # 2. Confirm the user exists
    user_response = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Fetch both skill lists
    user_skills_response = (
        supabase.table("user_skills").select("skill_name").eq("user_id", user_id).execute()
    )
    job_skills_response = (
        supabase.table("job_skills").select("skill_name").eq("job_id", job_id).execute()
    )

    user_skill_names = [row["skill_name"] for row in user_skills_response.data]
    job_skill_names = [row["skill_name"] for row in job_skills_response.data]

    # 4. Run the comparison
    result = calculate_match(user_skill_names, job_skill_names)

    return {
        "user_id": user_id,
        "job_id": job_id,
        "job_title": job["title"],
        **result,
    }