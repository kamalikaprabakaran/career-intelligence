"""
Handles resume upload: stores the PDF in Supabase Storage, extracts
its text and skills, and saves the results in the resumes table.
Also offers a convenience endpoint to copy extracted skills straight
into user_skills, so the existing matching engine picks them up.
"""

import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.database import supabase
from app.services.resume_parser import (
    extract_text_from_pdf,
    extract_combined_skills,
)

router = APIRouter(
    prefix="/users",
    tags=["Resumes"]
)


@router.post("/{user_id}/resume")
async def upload_resume(user_id: str, file: UploadFile = File(...)):
    # 1. Confirm user exists
    user_response = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()

    # 2. Extract text and skills BEFORE uploading, so we fail fast on bad PDFs
    try:
        resume_text = extract_text_from_pdf(file_bytes)
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {error}")

    extracted_skills = extract_combined_skills(resume_text)

    # 3. Upload the file to Supabase Storage
    storage_path = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    try:
        supabase.storage.from_("resumes").upload(
            storage_path,
            file_bytes,
            {"content-type": "application/pdf"},
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {error}")

    # 4. Save the record in the resumes table
    insert_response = (
        supabase.table("resumes")
        .insert({
            "user_id": user_id,
            "file_path": storage_path,
            "original_filename": file.filename,
            "extracted_text": resume_text,
            "extracted_skills": extracted_skills,
        })
        .execute()
    )

    if not insert_response.data:
        raise HTTPException(status_code=500, detail="Failed to save resume record")

    return insert_response.data[0]


@router.get("/{user_id}/resume")
def get_resume(user_id: str):
    response = (
        supabase.table("resumes")
        .select("*")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No resume found for this user")

    return response.data[0]


@router.post("/{user_id}/resume/apply-skills")
def apply_resume_skills(user_id: str):
    """
    Copies the most recent resume's extracted_skills into user_skills,
    so they immediately show up in matching/recommendations.
    Skips skills the user already has to avoid duplicates.
    """
    resume_response = (
        supabase.table("resumes")
        .select("extracted_skills")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )

    if not resume_response.data:
        raise HTTPException(status_code=404, detail="No resume found for this user")

    extracted_skills = resume_response.data[0]["extracted_skills"] or []

    existing_response = (
        supabase.table("user_skills").select("skill_name").eq("user_id", user_id).execute()
    )
    existing_skills = {row["skill_name"].strip().lower() for row in existing_response.data}

    new_skills = [s for s in extracted_skills if s.lower() not in existing_skills]

    added = []
    for skill_name in new_skills:
        result = (
            supabase.table("user_skills")
            .insert({"user_id": user_id, "skill_name": skill_name, "proficiency": None, "years_experience": 0})
            .execute()
        )
        if result.data:
            added.append(result.data[0])

    return {"added_skills": added, "skipped_existing": len(extracted_skills) - len(new_skills)}