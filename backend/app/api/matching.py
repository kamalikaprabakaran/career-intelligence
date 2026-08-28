"""
Exposes the skill-gap / match calculation as an API endpoint.
GET /match/{user_id}/{job_id} -> matched/missing/extra skills + match %
"""

from fastapi import APIRouter, HTTPException
import os
import json

from app.database import supabase
from app.services.matching import calculate_match
from app.schemas.match import MatchResponse, SkillGapResponse, LearningRecommendationsResponse

# Load curated learning resources once at module level
RESOURCES_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "learning_resources.json"
)

try:
    with open(RESOURCES_FILE, "r", encoding="utf-8") as f:
        LEARNING_RESOURCES = json.load(f)
except Exception as e:
    LEARNING_RESOURCES = {}


router = APIRouter(
    prefix="/users",
    tags=["Matching"]
)

# Root-level router to mount GET /skill-gap/{user_id}/{job_id} without /users prefix
skill_gap_router = APIRouter(
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

    # 4. Get required skills for the job (fetching skill_name and importance)
    job_skills_response = (
        supabase
        .table("job_skills")
        .select("skill_name, importance")
        .eq("job_id", job_id)
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


@skill_gap_router.get("/skill-gap/{user_id}/{job_id}", response_model=SkillGapResponse)
def get_user_job_skill_gap(user_id: str, job_id: str):
    """
    Focused skill gap analysis returning prioritized gaps (required before preferred).
    """
    # 1. Confirm user exists
    user_response = (
        supabase
        .table("users")
        .select("id")
        .eq("id", user_id)
        .execute()
    )
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Get job
    job_response = (
        supabase
        .table("jobs")
        .select("id, title")
        .eq("id", job_id)
        .execute()
    )
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
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

    # 4. Get job's skills with importance
    job_skills_response = (
        supabase
        .table("job_skills")
        .select("skill_name, importance")
        .eq("job_id", job_id)
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

    # 5. Calculate match
    match_result = calculate_match(
        user_skills=user_skills,
        job_skills=job_skills
    )

    # 6. Return response conforming to SkillGapResponse schema
    return {
        "user_id": user_id,
        "job_id": job_id,
        "job_title": job["title"],
        "prioritized_gaps": match_result["prioritized_gaps"]
    }


@skill_gap_router.get("/learning-recommendations/{user_id}/{job_id}", response_model=LearningRecommendationsResponse)
def get_learning_recommendations(user_id: str, job_id: str):
    """
    Exposes learning recommendations (courses/tutorials) mapped to missing prioritized skills.
    """
    # 1. Confirm user exists
    user_response = (
        supabase
        .table("users")
        .select("id")
        .eq("id", user_id)
        .execute()
    )
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Get job
    job_response = (
        supabase
        .table("jobs")
        .select("id, title")
        .eq("id", job_id)
        .execute()
    )
    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")
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

    # 4. Get job's skills with importance
    job_skills_response = (
        supabase
        .table("job_skills")
        .select("skill_name, importance")
        .eq("job_id", job_id)
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

    # 5. Calculate match
    match_result = calculate_match(
        user_skills=user_skills,
        job_skills=job_skills
    )

    prioritized_gaps = match_result["prioritized_gaps"]

    # 6. Map gaps to resources
    recommendations = []
    for gap in prioritized_gaps:
        name = gap["skill_name"]
        importance = gap["importance"]
        priority_rank = gap["priority_rank"]

        resources = LEARNING_RESOURCES.get(name, [])
        if not resources:
            import urllib.parse
            # Generic fallback Coursera query link
            query_encoded = urllib.parse.quote(name)
            resources = [
                {
                    "title": f"Search for {name} courses on Coursera",
                    "url": f"https://www.coursera.org/search?query={query_encoded}",
                    "type": "search"
                }
            ]

        recommendations.append({
            "skill_name": name,
            "importance": importance,
            "priority_rank": priority_rank,
            "resources": resources
        })

    return {
        "user_id": user_id,
        "job_id": job_id,
        "job_title": job["title"],
        "recommendations": recommendations
    }
