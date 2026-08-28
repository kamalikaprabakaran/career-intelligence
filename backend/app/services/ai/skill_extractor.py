"""
AI-based skill extraction using a pretrained spaCy resume skill model.

Model:
amjad-awad/skill-extractor

The model identifies entities labelled as SKILLS.
"""

import re

import spacy
from huggingface_hub import snapshot_download


MODEL_NAME = "amjad-awad/skill-extractor"


# Download once and use the local cached model.
# Hugging Face caches the downloaded files, so this will not
# repeatedly download the model on every call.
MODEL_PATH = snapshot_download(
    MODEL_NAME,
    repo_type="model"
)

_nlp = spacy.load(MODEL_PATH)


def clean_skill(skill: str) -> str:
    """
    Cleans and normalizes a skill extracted by the AI model.
    """

    skill = skill.strip()

    # Remove markdown/hash artifacts
    skill = re.sub(r"^#+", "", skill)

    # Normalize whitespace
    skill = re.sub(r"\s+", " ", skill)

    # Remove unwanted punctuation at the edges
    skill = skill.strip(" \t\n\r.,;:!?()[]{}<>|")

    return skill.strip()


def extract_skills_with_ai(text: str) -> list[str]:
    """
    Extract skills from resume text using the pretrained
    spaCy resume skill extraction model.
    """

    if not text or not text.strip():
        return []

    doc = _nlp(text)

    skills = []
    seen = set()

    for entity in doc.ents:

        # The model uses SKILLS as the skill entity label.
        if "SKILLS" not in entity.label_.upper():
            continue

        skill = clean_skill(entity.text)

        if not skill:
            continue

        # Ignore extremely short fragments
        if len(skill) < 2:
            continue

        normalized = skill.lower()

        if normalized not in seen:
            seen.add(normalized)
            skills.append(skill)

    return sorted(skills, key=str.lower)