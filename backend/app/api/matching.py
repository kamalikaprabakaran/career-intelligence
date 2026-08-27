"""
Exposes the skill-gap / match calculation as an API endpoint.
GET /match/{user_id}/{job_id} -> matched/missing/extra skills + match %
"""

from fastapi import APIRouter, HTTPException

from app.database import supabase
from app.services.matching import calculate_match
from app.schemas.match import MatchResponse


router = APIRouter(
    prefix="/users",
    tags=["Matching"]
)


@router.get("/{user_id}/jobs/{job_id}/match", response_model=MatchResponse)
def match_user_with_job(user_id: str, job_id: str):

    # 1. Check that the user exists
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

    # 2. Get the job
    job_response = (
        supabase
        .table("jobs")
        .select("*")
        .eq("id", job_id)
        .execute()
    )

    if not job_response.data:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job = job_response.data[0]

    # 3. Get user's skills
    user_skills_response = (
        supabase
        .table("user_skills")
        .select("skill_name")
        .eq("user_id", user_id)
        .execute()
    )

    user_skills = [
        row["skill_name"]
        for row in user_skills_response.data
        if row.get("skill_name")
    ]

    # 4. Get required skills for the job
    job_skills_response = (
        supabase
        .table("job_skills")
        .select("skill_name")
        .eq("job_id", job_id)
        .execute()
    )

    job_skills = [
        row["skill_name"]
        for row in job_skills_response.data
        if row.get("skill_name")
    ]

    # 5. Calculate the match
    match_result = calculate_match(
        user_skills=user_skills,
        job_skills=job_skills
    )

    # 6. Return the complete result
    return {
        "user_id": user_id,
        "job_id": job_id,
        "job_title": job["title"],
        **match_result
    }