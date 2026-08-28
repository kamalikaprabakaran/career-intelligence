"""
Accuracy tests for Skill Matcher.
Tests exact, alias, fuzzy, and distinct cases to verify correctness.
"""

import sys
import logging
from app.services.matching import calculate_match

# Configure simple logging to stdout to see the info outputs during tests
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")


def run_accuracy_tests():
    # Test cases: (User Skill, Job Skill, Should Match, Expected Match Type if matched)
    test_cases = [
        ("Python", "Python", True, "exact"),
        ("python", "Python", True, "exact"),
        ("ML", "Machine Learning", True, "alias"),
        ("sklearn", "scikit-learn", True, "alias"),
        ("powerbi", "power bi", True, "alias"),
        ("Pyhton", "Python", True, "fuzzy"),
        ("fast-api", "fastapi", True, "fuzzy"),
        ("postgre", "postgresql", True, "alias"),
        ("git", "github", False, None),
        ("java", "javascript", False, None),
        ("aws", "azure", False, None),
        ("Docker", "docker", True, "exact"),
        ("React.js", "React.JS", True, "exact"),
        ("C++", "C#", False, None),
    ]

    passed_count = 0
    total_count = len(test_cases)
    
    print("\n" + "="*80)
    print(f"{'USER SKILL':<15} | {'JOB SKILL':<18} | {'EXPECTED':<8} | {'ACTUAL':<8} | {'FIRE PATH':<10} | {'STATUS':<6}")
    print("="*80)
    
    for user_skill, job_skill, should_match, expected_type in test_cases:
        res = calculate_match([user_skill], [job_skill])
        
        matched_list = res.get("matched_skills", [])
        actual_match = len(matched_list) > 0
        
        # Get path fired from match_details
        match_details = res.get("match_details", [])
        actual_type = match_details[0]["type"] if match_details else None
        score = match_details[0].get("score") if match_details else None
        
        path_str = actual_type if actual_type else "none"
        if score is not None and actual_type == "fuzzy":
            path_str += f" ({score}%)"
            
        status = "PASSED" if actual_match == should_match and (not should_match or actual_type == expected_type) else "FAILED"
        if status == "PASSED":
            passed_count += 1
            
        expected_str = "Match" if should_match else "No Match"
        actual_str = "Match" if actual_match else "No Match"
        
        print(f"{user_skill:<15} | {job_skill:<18} | {expected_str:<8} | {actual_str:<8} | {path_str:<10} | {status:<6}")
        
    print("="*80)
    accuracy = (passed_count / total_count) * 100
    print(f"Accuracy: {passed_count}/{total_count} passed ({accuracy:.1f}%)")
    print("="*80 + "\n")
    
    if passed_count != total_count:
        sys.exit(1)


if __name__ == "__main__":
    run_accuracy_tests()
