"""
Extracts raw text from a PDF resume and matches it against a known
skill dictionary. Baseline version - exact keyword matching only.
"""

import re
from io import BytesIO
from pypdf import PdfReader
from app.services.skill_dictionary import KNOWN_SKILLS


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Reads a PDF's raw text content from its bytes."""
    reader = PdfReader(BytesIO(file_bytes))
    text_parts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_parts)


def extract_skills_from_text(text: str) -> list[str]:
    """
    Scans the resume text for any skill in KNOWN_SKILLS.
    Uses word-boundary regex matching so 'sql' does NOT match inside
    'sqlite', and 'java' does NOT match inside 'javascript'.
    """
    lowered_text = text.lower()
    found_skills = []

    for skill in KNOWN_SKILLS:
        # Escape special regex characters in skills like "c++" or "ci/cd"
        pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
        if re.search(pattern, lowered_text):
            found_skills.append(skill)

    return sorted(found_skills)