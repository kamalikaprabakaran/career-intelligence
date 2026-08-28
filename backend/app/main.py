"""
Application entry point.
Run locally with:  uvicorn app.main:app --reload  (from inside backend/)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import users
from app.api import skills
from app.api import jobs
from app.api import matching
from app.api import recommendations
from app.api import resumes

app = FastAPI(
    title="AI-Powered Skill Gap Analysis & Fair Job Recommendation System",
    description="Backend API - Phase 1 & 2: foundation + Supabase connection.",
    version="0.1.0",
)

# Allow the frontend (running on a different port/domain) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers - as we build Phase 3+, new routers get added here
app.include_router(users.router)
app.include_router(skills.router)
app.include_router(jobs.router)
app.include_router(matching.router)
app.include_router(matching.skill_gap_router)
app.include_router(recommendations.router)
app.include_router(resumes.router)


@app.get("/")
def root():
    """Health check - confirms the API itself is running."""
    return {"status": "ok", "message": "Career Intelligence API is running"}


@app.get("/health/db")
def db_health_check():
    """Confirms FastAPI can actually reach Supabase, not just itself."""
    from app.database import supabase

    try:
        supabase.table("users").select("id").limit(1).execute()
        return {"status": "ok", "supabase": "connected"}
    except Exception as error:
        return {"status": "error", "supabase": "not connected", "detail": str(error)}