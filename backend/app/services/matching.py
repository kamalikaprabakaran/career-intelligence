"""
Core skill-matching logic.

Uses skill normalization so common aliases such as:
- sklearn -> scikit-learn
- powerbi -> power bi
- ml -> machine learning
- reactjs -> react

are treated as the same skill.
"""

from typing import Union, List
import re
import logging
from rapidfuzz import fuzz
from app.services.skill_normalizer import normalize_skill

logger = logging.getLogger(__name__)


def clean_skill(skill_name: str) -> str:
    """
    Basic text cleaning before comparison.
    Matches the normalization preprocessing.
    """
    skill = skill_name.strip().lower()
    skill = re.sub(r"\s+", " ", skill)
    skill = skill.strip(".,;:!?()[]{}")
    return skill


def calculate_match(user_skills: list[str], job_skills: list[Union[str, dict]], threshold: float = 80.0) -> dict:
    """
    Compares a user's skills against a job's required skills
    after normalizing skill names.
    
    Supports a layered fallback matching:
    1. Exact Match (cleaned string equality)
    2. Alias-based Match (normalized/alias resolved string equality)
    3. Fuzzy Match (via RapidFuzz token_sort_ratio threshold >= 80.0)
    
    Collects skill gap importance rankings based on job_skills metadata.
    """

    # 1. Clean and normalize both sets
    normalized_user = {
        normalize_skill(skill)
        for skill in user_skills
        if skill and skill.strip()
    }

    # Extract job skills and their importance details
    job_skills_strings = []
    job_importance_map = {}
    
    for js in job_skills:
        if isinstance(js, dict):
            name = js.get("skill_name")
            importance = js.get("importance", "required")
        else:
            name = js
            importance = "required"
            
        if name and name.strip():
            job_skills_strings.append(name)
            norm_name = normalize_skill(name)
            # Map normalized name to its importance (prefer 'required' if duplicate entries clash)
            clean_imp = importance.lower() if importance else "required"
            if norm_name not in job_importance_map or clean_imp == "required":
                job_importance_map[norm_name] = clean_imp

    normalized_job = {
        normalize_skill(skill)
        for skill in job_skills_strings
    }

    # 2. Find standard exact and alias matches
    exact_and_alias = normalized_user & normalized_job
    
    # Classify the type of match for exact and alias matches
    match_details = []
    
    for s in sorted(exact_and_alias):
        # Retrieve original spelling to determine if it was raw exact match or alias
        matching_user_skills = [u for u in user_skills if u and normalize_skill(u) == s]
        matching_job_skills = [j for j in job_skills_strings if j and normalize_skill(j) == s]
        
        # Check if there is any pair with identical clean representations
        exact_found = False
        best_u, best_j = s, s
        for u in matching_user_skills:
            for j in matching_job_skills:
                if clean_skill(u) == clean_skill(j):
                    exact_found = True
                    best_u = u
                    best_j = j
                    break
            if exact_found:
                break
        
        if exact_found:
            match_type = "exact"
            u_orig, j_orig = best_u, best_j
        else:
            u_orig = matching_user_skills[0] if matching_user_skills else s
            j_orig = matching_job_skills[0] if matching_job_skills else s
            match_type = "alias"
            
        match_details.append({
            "job_skill": j_orig,
            "user_skill": u_orig,
            "type": match_type,
            "score": 100.0,
        })
        logger.info("%s match: Job skill '%s' matched with User skill '%s'", match_type.upper(), j_orig, u_orig)

    # 3. Handle unmatched skills via fuzzy matching
    unmatched_job = normalized_job - exact_and_alias
    unmatched_user = normalized_user - exact_and_alias
    
    fuzzy_matched_jobs = set()
    fuzzy_matched_users = set()
    
    for j_norm in sorted(unmatched_job):
        best_u_norm = None
        best_score = 0.0
        
        for u_norm in sorted(unmatched_user):
            if u_norm in fuzzy_matched_users:
                continue
            
            # Compute similarity score using token_sort_ratio
            score = fuzz.token_sort_ratio(u_norm, j_norm)
            if score > best_score:
                best_score = score
                best_u_norm = u_norm
                
        if best_score >= threshold and best_u_norm is not None:
            fuzzy_matched_jobs.add(j_norm)
            fuzzy_matched_users.add(best_u_norm)
            
            # Find original representations for logging
            matching_user_skills = [u for u in user_skills if u and normalize_skill(u) == best_u_norm]
            matching_job_skills = [j for j in job_skills_strings if j and normalize_skill(j) == j_norm]
            u_orig = matching_user_skills[0] if matching_user_skills else best_u_norm
            j_orig = matching_job_skills[0] if matching_job_skills else j_norm
            
            match_details.append({
                "job_skill": j_orig,
                "user_skill": u_orig,
                "type": "fuzzy",
                "score": round(best_score, 1),
            })
            logger.info("FUZZY match: Job skill '%s' matched with User skill '%s' (score: %.1f)", j_orig, u_orig, best_score)

    # 4. Construct final results sets
    matched_skills = exact_and_alias | fuzzy_matched_jobs
    missing_skills = normalized_job - matched_skills
    extra_skills = normalized_user - (exact_and_alias | fuzzy_matched_users)
    
    total_required = len(normalized_job)
    match_percentage = (
        len(matched_skills) / total_required * 100
        if total_required > 0
        else 0.0
    )

    # 5. Build prioritized gaps
    missing_list = list(missing_skills)
    
    # Sort key: required first (importance == "required"), preferred next, then alphabetical name
    def gap_sort_key(skill_norm: str) -> tuple:
        imp = job_importance_map.get(skill_norm, "required")
        imp_rank = 0 if imp == "required" else (1 if imp == "preferred" else 2)
        return (imp_rank, skill_norm)
        
    missing_list.sort(key=gap_sort_key)
    
    prioritized_gaps = []
    for idx, m_norm in enumerate(missing_list):
        imp = job_importance_map.get(m_norm, "required")
        prioritized_gaps.append({
            "skill_name": m_norm,
            "importance": imp,
            "priority_rank": idx + 1
        })

    return {
        "matched_skills": sorted(list(matched_skills)),
        "missing_skills": sorted(list(missing_skills)),
        "extra_skills": sorted(list(extra_skills)),
        "match_percentage": round(match_percentage, 1),
        "match_details": match_details,
        "prioritized_gaps": prioritized_gaps,
    }