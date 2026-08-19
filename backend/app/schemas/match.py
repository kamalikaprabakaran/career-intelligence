"""
Defines the shape of a skill-gap / match result returned to the frontend.
"""

from pydantic import BaseModel
from typing import List


class MatchResponse(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    matched_skills: List[str]
    missing_skills: List[str]
    extra_skills: List[str]
    match_percentage: float