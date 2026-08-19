"""
Defines the shape of a single ranked job recommendation, and the
full list returned for a user.
"""

from pydantic import BaseModel
from typing import List


class JobRecommendation(BaseModel):
    job_id: str
    job_title: str
    company: str | None = None
    matched_skills: List[str]
    missing_skills: List[str]
    match_percentage: float


class RecommendationListResponse(BaseModel):
    user_id: str
    recommendations: List[JobRecommendation]