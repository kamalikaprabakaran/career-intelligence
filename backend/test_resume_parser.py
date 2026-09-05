"""
Pytest tests for the resume parser functionality.

Tests cover:
1. extract_text_from_pdf  - PDF text extraction
2. extract_skills_from_text  - Dictionary/regex skill extraction
3. extract_combined_skills  - Combined dictionary + AI extraction
"""

import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO

from pypdf import PdfWriter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_test_pdf(text: str) -> bytes:
    """Create a minimal single-page PDF containing the given text."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)

    # PdfWriter doesn't directly write text to pages in pypdf,
    # so we'll need to mock the reader for text content tests.
    # For structural tests, we verify PdfReader can open the bytes.
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


SAMPLE_RESUME_TEXT = """
John Doe
Software Engineer

Skills:
- Python, Java, JavaScript
- Django, Flask, FastAPI
- PostgreSQL, MongoDB
- Docker, Kubernetes, AWS
- Machine Learning, Deep Learning
- Git, Linux, CI/CD
- Agile, Scrum
- Communication, Leadership

Experience:
Senior Developer at TechCo (2020–2024)
- Built REST API services using FastAPI and Python
- Deployed microservices on Docker and Kubernetes
- Managed PostgreSQL databases
"""


# ============================================================================
# Test: extract_text_from_pdf
# ============================================================================

class TestExtractTextFromPdf:
    """Tests for PDF text extraction."""

    def test_valid_pdf_returns_string(self):
        """A valid PDF should return a string (even if blank)."""
        from app.services.resume_parser import extract_text_from_pdf

        pdf_bytes = create_test_pdf("")
        result = extract_text_from_pdf(pdf_bytes)
        assert isinstance(result, str)

    def test_invalid_bytes_raises(self):
        """Random non-PDF bytes should raise an error."""
        from app.services.resume_parser import extract_text_from_pdf

        with pytest.raises(Exception):
            extract_text_from_pdf(b"this is not a pdf")

    def test_extracted_text_from_mocked_pdf(self):
        """Verify text extraction when PdfReader returns known text."""
        from app.services.resume_parser import extract_text_from_pdf

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Python Developer with FastAPI experience"

        with patch("app.services.resume_parser.PdfReader") as MockReader:
            instance = MockReader.return_value
            instance.pages = [mock_page]
            result = extract_text_from_pdf(b"fake-pdf-bytes")

        assert "Python" in result
        assert "FastAPI" in result


# ============================================================================
# Test: extract_skills_from_text
# ============================================================================

class TestExtractSkillsFromText:
    """Tests for dictionary/regex based skill extraction."""

    def test_known_skills_are_found(self):
        """Skills present in KNOWN_SKILLS should be extracted."""
        from app.services.resume_parser import extract_skills_from_text

        result = extract_skills_from_text(SAMPLE_RESUME_TEXT)

        expected_subset = [
            "python", "java", "javascript",
            "django", "flask", "fastapi",
            "postgresql", "mongodb",
            "docker", "kubernetes", "aws",
            "machine learning", "deep learning",
            "git", "linux", "ci/cd",
            "agile", "scrum",
            "communication", "leadership",
        ]

        result_lower = [s.lower() for s in result]
        for skill in expected_subset:
            assert skill in result_lower, f"Expected '{skill}' to be extracted"

    def test_unknown_skills_are_not_extracted(self):
        """Skills NOT in the dictionary should not appear."""
        from app.services.resume_parser import extract_skills_from_text

        text = "Experience with Haskell, Elixir, and Fortran"
        result = extract_skills_from_text(text)
        result_lower = [s.lower() for s in result]

        assert "haskell" not in result_lower
        assert "elixir" not in result_lower
        assert "fortran" not in result_lower

    def test_case_insensitive_matching(self):
        """Matching should be case-insensitive."""
        from app.services.resume_parser import extract_skills_from_text

        text = "Proficient in PYTHON, DOCKER, and FASTAPI"
        result = extract_skills_from_text(text)
        result_lower = [s.lower() for s in result]

        assert "python" in result_lower
        assert "docker" in result_lower
        assert "fastapi" in result_lower

    def test_empty_text_returns_empty(self):
        """Empty input should return an empty list."""
        from app.services.resume_parser import extract_skills_from_text

        assert extract_skills_from_text("") == []

    def test_result_is_sorted(self):
        """Returned skills should be sorted alphabetically."""
        from app.services.resume_parser import extract_skills_from_text

        result = extract_skills_from_text(SAMPLE_RESUME_TEXT)
        assert result == sorted(result)

    def test_word_boundary_matching(self):
        """
        Ensure partial-word matches don't fire.
        For example 'sql' should not match inside 'postgresql' on its own
        without 'sql' being present as a standalone term.
        """
        from app.services.resume_parser import extract_skills_from_text

        text = "Experience with PostgreSQL databases"
        result = extract_skills_from_text(text)
        result_lower = [s.lower() for s in result]

        assert "postgresql" in result_lower
        # 'sql' should NOT match as a substring inside 'postgresql'
        # (word-boundary regex prevents it)
        assert "sql" not in result_lower


# ============================================================================
# Test: extract_combined_skills (mocking AI extractor)
# ============================================================================

class TestExtractCombinedSkills:
    """Tests for the combined dictionary + AI skill extraction."""

    @patch("app.services.resume_parser.extract_skills_with_ai")
    def test_combines_dictionary_and_ai_skills(self, mock_ai):
        """Both dictionary and AI skills should appear in the result."""
        from app.services.resume_parser import extract_combined_skills

        mock_ai.return_value = ["TensorFlow", "Keras", "NLP"]
        text = "Experienced in Python and Docker"
        result = extract_combined_skills(text)
        result_lower = [s.lower() for s in result]

        # Dictionary skills
        assert "python" in result_lower
        assert "docker" in result_lower
        # AI skills
        assert "tensorflow" in result_lower
        assert "keras" in result_lower

    @patch("app.services.resume_parser.extract_skills_with_ai")
    def test_deduplication(self, mock_ai):
        """Duplicate skills from both sources should be deduplicated."""
        from app.services.resume_parser import extract_combined_skills

        # AI returns 'Python' which dictionary also finds
        mock_ai.return_value = ["Python", "Rust"]
        text = "Skilled in Python programming"
        result = extract_combined_skills(text)
        result_lower = [s.lower() for s in result]

        # Should appear only once
        assert result_lower.count("python") == 1

    @patch("app.services.resume_parser.extract_skills_with_ai")
    def test_ai_failure_falls_back_to_dictionary(self, mock_ai):
        """If AI extraction raises, only dictionary skills should return."""
        from app.services.resume_parser import extract_combined_skills

        mock_ai.side_effect = RuntimeError("Model unavailable")
        text = "Expert in Java and Docker"
        result = extract_combined_skills(text)
        result_lower = [s.lower() for s in result]

        assert "java" in result_lower
        assert "docker" in result_lower
        assert len(result) > 0  # didn't crash

    @patch("app.services.resume_parser.extract_skills_with_ai")
    def test_result_sorted_and_cleaned(self, mock_ai):
        """Result should be sorted and cleaned of trailing punctuation."""
        from app.services.resume_parser import extract_combined_skills

        mock_ai.return_value = ["  TensorFlow. ", "Keras,"]
        text = "Python developer"
        result = extract_combined_skills(text)

        # Check sorted
        assert result == sorted(result, key=str.lower)
        # Check cleaned
        for skill in result:
            assert not skill.endswith(".")
            assert not skill.endswith(",")
            assert skill == skill.strip()
