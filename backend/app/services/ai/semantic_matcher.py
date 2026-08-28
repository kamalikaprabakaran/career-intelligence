"""
Semantic skill matching using sentence embeddings.
"""

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


MODEL_NAME = "all-MiniLM-L6-v2"

_model = SentenceTransformer(MODEL_NAME)


def calculate_skill_similarity(
    user_skill: str,
    job_skill: str
) -> float:
    """
    Calculate semantic similarity between two skills.
    Returns a score between 0 and 1.
    """

    embeddings = _model.encode(
        [user_skill, job_skill],
        normalize_embeddings=True
    )

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    return round(float(similarity), 4)


def find_semantic_matches(
    user_skills: list[str],
    job_skills: list[str],
    threshold: float = 0.65
) -> list[dict]:
    """
    Find semantically similar skills between user skills
    and job skills.
    """

    matches = []

    for user_skill in user_skills:

        best_match = None
        best_score = 0.0

        for job_skill in job_skills:

            score = calculate_skill_similarity(
                user_skill,
                job_skill
            )

            if score > best_score:
                best_score = score
                best_match = job_skill

        if best_match and best_score >= threshold:

            matches.append({
                "user_skill": user_skill,
                "job_skill": best_match,
                "similarity": best_score
            })

    return matches