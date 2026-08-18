from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SkillCreate(BaseModel):
    skill_name: str
    proficiency: Optional[str] = None
    years_experience: Optional[float] = 0


class SkillResponse(BaseModel):
    id: str
    user_id: str
    skill_name: str
    proficiency: Optional[str] = None
    years_experience: Optional[float] = 0
    created_at: datetime