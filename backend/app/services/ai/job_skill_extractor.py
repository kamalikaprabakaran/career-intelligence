"""
AI-based job skill extraction.

Extracts technical and professional skills from a job description
using the same pretrained resume skill extraction model.
"""

from app.services.ai.skill_extractor import extract_skills_with_ai


def extract_job_skills(
    title: str = "",
    description: str = ""
) -> list[str]:
    """
    Extract skills from a job title and description.

    The title is included because job titles can contain useful
    skill information, such as:
    - Python Developer
    - Machine Learning Engineer
    - React Developer
    """

    text = f"{title}\n{description}".strip()

    if not text:
        return []

    return extract_skills_with_ai(text)