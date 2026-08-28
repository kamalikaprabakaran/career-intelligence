from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.job import JobCreate, JobSkillCreate
from app.services.ai.job_skill_extractor import extract_job_skills

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("")
def create_job(job: JobCreate):

    # 1. Create the job
    response = (
        supabase
        .table("jobs")
        .insert(job.model_dump())
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create job"
        )

    created_job = response.data[0]
    job_id = created_job["id"]

    # 2. Extract skills using AI
    from app.services.ai.job_skill_extractor import extract_job_skills

    try:
        extracted_skills = extract_job_skills(
            job.title,
            job.description or ""
        )
    except Exception as error:
        print(f"Job skill extraction failed: {error}")
        extracted_skills = []

    # 3. Save extracted skills in jobs.extracted_skills
    supabase.table("jobs").update(
        {
            "extracted_skills": extracted_skills
        }
    ).eq("id", job_id).execute()

    # 4. Also insert skills into job_skills
    for skill_name in extracted_skills:
        supabase.table("job_skills").insert(
            {
                "job_id": job_id,
                "skill_name": skill_name,
                "importance": "required"
            }
        ).execute()

    # 5. Return complete job
    created_job["extracted_skills"] = extracted_skills

    return created_job


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