"""
Core skill-matching logic - the baseline version.

This is deliberately simple (exact, case-insensitive string matching).
Per the roadmap: build a working baseline first, then improve it later
with embeddings/semantic matching (Phase 6 upgrade).
"""


def normalize_skill(skill_name: str) -> str:
    """Lowercase + strip whitespace so 'Python ' and 'python' are treated as the same skill."""
    return skill_name.strip().lower()


def calculate_match(user_skills: list[str], job_skills: list[str]) -> dict:
    """
    Compares a user's skills against a job's required skills.

    Returns matched skills, missing skills, extra skills the user has
    that the job didn't ask for, and an overall match percentage.
    """
    normalized_user = {normalize_skill(s) for s in user_skills}
    normalized_job = {normalize_skill(s) for s in job_skills}

    matched = normalized_user & normalized_job
    missing = normalized_job - normalized_user
    extra = normalized_user - normalized_job

    total_required = len(normalized_job)
    match_percentage = (len(matched) / total_required * 100) if total_required > 0 else 0.0

    return {
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "extra_skills": sorted(extra),
        "match_percentage": round(match_percentage, 1),
    }