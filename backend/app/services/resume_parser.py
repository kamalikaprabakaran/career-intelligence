"""
Resume text and skill extraction.

Uses two approaches:
1. Dictionary/regex extraction for reliable known skills.
2. AI extraction for discovering additional skills.

The results are combined and duplicates are removed.
"""

import re
from io import BytesIO

from pypdf import PdfReader

from app.services.skill_dictionary import KNOWN_SKILLS
from app.services.ai.skill_extractor import extract_skills_with_ai


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Reads raw text from a PDF."""
    reader = PdfReader(BytesIO(file_bytes))
    text_parts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_parts)


def extract_skills_from_text(text: str) -> list[str]:
    """
    Extract skills using the existing dictionary + regex approach.
    """

    lowered_text = text.lower()
    found_skills = []

    for skill in KNOWN_SKILLS:
        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(skill.lower())
            + r"(?![a-z0-9])"
        )

        if re.search(pattern, lowered_text):
            found_skills.append(skill)

    return sorted(found_skills)


def extract_combined_skills(text: str) -> list[str]:
    """
    Combines dictionary-based and AI-based skill extraction.
    Removes duplicate skills.
    """

    # Dictionary-based extraction
    dictionary_skills = extract_skills_from_text(text)

    # AI-based extraction
    try:
        ai_skills = extract_skills_with_ai(text)
    except Exception as error:
        print(f"AI skill extraction failed: {error}")
        ai_skills = []

    # Combine both
    combined_skills = dictionary_skills + ai_skills

    # Remove duplicates
    unique_skills = {}

    for skill in combined_skills:
        skill = skill.strip().rstrip(".,;:")

        if skill:
            unique_skills[skill.lower()] = skill

    return sorted(unique_skills.values(), key=str.lower)