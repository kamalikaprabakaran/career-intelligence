from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.job import JobCreate, JobSkillCreate

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("")
def create_job(job: JobCreate):
    response = supabase.table("jobs").insert(job.model_dump()).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create job")

    return response.data[0]


@router.get("")
def list_jobs():
    response = (
        supabase
        .table("jobs")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.get("/{job_id}")
def get_job(job_id: str):
    response = supabase.table("jobs").select("*").eq("id", job_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")

    return response.data[0]


@router.post("/{job_id}/skills")
def add_job_skill(job_id: str, skill: JobSkillCreate):
    job_response = supabase.table("jobs").select("id").eq("id", job_id).execute()

    if not job_response.data:
        raise HTTPException(status_code=404, detail="Job not found")

    response = (
        supabase
        .table("job_skills")
        .insert({
            "job_id": job_id,
            "skill_name": skill.skill_name,
            "importance": skill.importance
        })
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to add job skill")

    return response.data[0]


@router.get("/{job_id}/skills")
def get_job_skills(job_id: str):
    response = (
        supabase
        .table("job_skills")
        .select("*")
        .eq("job_id", job_id)
        .execute()
    )
    return response.data