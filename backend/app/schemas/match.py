"""
Defines the shape of a skill-gap / match result returned to the frontend.
"""

from pydantic import BaseModel
from typing import List


class PrioritizedGap(BaseModel):
    skill_name: str
    importance: str
    priority_rank: int


class MatchResponse(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    matched_skills: List[str]
    missing_skills: List[str]
    extra_skills: List[str]
    match_percentage: float
    prioritized_gaps: List[PrioritizedGap] = []


class SkillGapResponse(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    prioritized_gaps: List[PrioritizedGap]


class LearningResource(BaseModel):
    title: str
    url: str
    type: str


class SkillLearningRecommendation(BaseModel):
    skill_name: str
    importance: str
    priority_rank: int
    resources: List[LearningResource]


class LearningRecommendationsResponse(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    recommendations: List[SkillLearningRecommendation]

