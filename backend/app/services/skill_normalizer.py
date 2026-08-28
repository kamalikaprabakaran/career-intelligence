"""
Normalizes skill names and handles common skill aliases.
"""

import re


SKILL_ALIASES = {
    "ml": "machine learning",
    "machine-learning": "machine learning",

    "powerbi": "power bi",
    "power-bi": "power bi",

    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",

    "js": "javascript",
    "ts": "typescript",

    "postgres": "postgresql",
    "postgre": "postgresql",

    "reactjs": "react",
    "react.js": "react",

    "nodejs": "node.js",
    "node js": "node.js",

    "restful api": "rest api",
    "restful apis": "rest api",

    "git hub": "github",

    "numpy": "numpy",
    "pandas": "pandas",
}


def normalize_skill(skill_name: str) -> str:
    """
    Normalize a skill name for comparison.
    """

    skill = skill_name.strip().lower()

    # Normalize whitespace
    skill = re.sub(r"\s+", " ", skill)

    # Remove surrounding punctuation
    skill = skill.strip(".,;:!?()[]{}")

    # Apply alias mapping
    return SKILL_ALIASES.get(skill, skill)