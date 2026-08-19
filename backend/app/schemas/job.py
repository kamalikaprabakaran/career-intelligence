from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobCreate(BaseModel):
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    created_at: datetime


class JobSkillCreate(BaseModel):
    skill_name: str
    importance: Optional[str] = None