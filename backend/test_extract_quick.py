"""Quick skill extraction test with the sample PDF."""
import sys
sys.path.insert(0, ".")

from app.services.resume_parser import extract_text_from_pdf, extract_combined_skills

with open("../sample.pdf", "rb") as f:
    raw = f.read()

text = extract_text_from_pdf(raw)
print("EXTRACTED TEXT:", repr(text[:300]))

skills = extract_combined_skills(text)
print("SKILLS:", skills)
print("COUNT:", len(skills))
