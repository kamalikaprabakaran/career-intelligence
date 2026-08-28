"""
Ranks every job in the database against a user's skills and
returns them sorted by match percentage, highest first.

This is Phase 7: Fair Job Recommendation - baseline version.
Reuses the same calculate_match() logic from the Skill Gap Engine
so a single job match and a ranked list always agree with each other.
"""

from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.recommendation import JobRecommendation, RecommendationListResponse
from app.services.matching import calculate_match

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


@router.get("/{user_id}", response_model=RecommendationListResponse)
def get_recommendations(
    user_id: str,
    min_match: float = 0.0,
    limit: int | None = None
):
    # 1. Confirm the user exists
    user_response = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Get the user's skills once (reused for every job comparison)
    user_skills_response = (
        supabase.table("user_skills").select("skill_name").eq("user_id", user_id).execute()
    )
    user_skill_names = [row["skill_name"] for row in user_skills_response.data]

    # 3. Get every job in the database
    jobs_response = supabase.table("jobs").select("id, title, company").execute()
    jobs = jobs_response.data

    recommendations = []

    for job in jobs:
        # Retrieve skill_name and importance for the job
        job_skills_response = (
            supabase.table("job_skills")
            .select("skill_name, importance")
            .eq("job_id", job["id"])
            .execute()
        )
        
        job_skills = [
            {
                "skill_name": row["skill_name"],
                "importance": row.get("importance", "required")
            }
            for row in job_skills_response.data
            if row.get("skill_name")
        ]

        # Skip jobs that have no skills defined - nothing meaningful to compare
        if not job_skills:
            continue

        result = calculate_match(user_skill_names, job_skills)

        # Apply min_match filtering
        if result["match_percentage"] < min_match:
            continue

        recommendations.append(JobRecommendation(
            job_id=job["id"],
            job_title=job["title"],
            company=job.get("company"),
            matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"],
            match_percentage=result["match_percentage"],
            prioritized_gaps=result["prioritized_gaps"],
        ))

    # 4. Rank: highest match percentage first
    recommendations.sort(key=lambda r: r.match_percentage, reverse=True)

    # 5. Apply limit
    if limit is not None and limit >= 0:
        recommendations = recommendations[:limit]

    return {
        "user_id": user_id,
        "recommendations": recommendations,
    }