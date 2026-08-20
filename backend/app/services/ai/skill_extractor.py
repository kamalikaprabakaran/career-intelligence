from transformers import pipeline
import re


MODEL_NAME = "oksomu/resume-ner"


_skill_pipeline = pipeline(
    "token-classification",
    model=MODEL_NAME,
    aggregation_strategy="simple"
)


def clean_skill(skill: str) -> str:
    """
    Cleans noisy output produced by the NER model.
    """

    skill = skill.strip()

    # Remove markdown/hash artifacts
    skill = re.sub(r"^#+", "", skill)

    # Remove unwanted punctuation from beginning/end
    skill = skill.strip(" \t\n\r.,;:!?()[]{}<>|/-")

    # Normalize whitespace
    skill = re.sub(r"\s+", " ", skill)

    return skill.strip()


def extract_skills_with_ai(text: str) -> list[str]:
    """
    Extract skills from resume text using a pretrained
    resume NER model and clean its output.
    """

    results = _skill_pipeline(text)

    skills = []

    for item in results:
        entity = item.get("entity_group", "").upper()

        if entity != "SKILL":
            continue

        skill = clean_skill(item.get("word", ""))

        if not skill:
            continue

        # Ignore obviously invalid short fragments
        if len(skill) < 2:
            continue

        # Avoid UI fragments such as ##UI
        if skill.lower() in {"ui", "design"}:
            continue

        # Prevent duplicates
        if skill.lower() not in {s.lower() for s in skills}:
            skills.append(skill)

    return sorted(skills, key=str.lower)