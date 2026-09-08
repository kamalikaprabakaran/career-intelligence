"""
Create a minimal but real text PDF with skill keywords using raw PDF syntax.
pypdf can read it; we then verify extract_combined_skills finds the skills.
"""
import sys, io
sys.path.insert(0, ".")

# Build a minimal valid PDF with real embedded text using low-level PDF syntax
def make_skill_pdf(skills_text: str) -> bytes:
    """
    Builds a minimal, spec-valid, selectable-text PDF.
    pypdf's PdfReader can extract the text from it.
    """
    # PDF object references
    # 1: catalog  2: pages  3: page  4: font  5: content stream
    content = f"BT /F1 12 Tf 50 700 Td ({skills_text}) Tj ET"
    content_bytes = content.encode()
    stream_len = len(content_bytes)

    # Build objects
    objects = {}
    objects[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objects[2] = b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
    objects[3] = (
        b"<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 612 792] "
        b"/Contents 5 0 R "
        b"/Resources << /Font << /F1 4 0 R >> >> "
        b">>"
    )
    objects[4] = (
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    )
    objects[5] = (
        f"<< /Length {stream_len} >>".encode() +
        b"\nstream\n" +
        content_bytes +
        b"\nendstream"
    )

    # Write PDF
    buf = io.BytesIO()
    buf.write(b"%PDF-1.4\n")

    offsets = {}
    for obj_num, obj_data in objects.items():
        offsets[obj_num] = buf.tell()
        buf.write(f"{obj_num} 0 obj\n".encode())
        buf.write(obj_data)
        buf.write(b"\nendobj\n")

    xref_offset = buf.tell()
    buf.write(b"xref\n")
    buf.write(f"0 {len(objects)+1}\n".encode())
    buf.write(b"0000000000 65535 f \n")
    for i in range(1, len(objects)+1):
        buf.write(f"{offsets[i]:010d} 00000 n \n".encode())

    buf.write(b"trailer\n")
    buf.write(f"<< /Size {len(objects)+1} /Root 1 0 R >>\n".encode())
    buf.write(b"startxref\n")
    buf.write(f"{xref_offset}\n".encode())
    buf.write(b"%%EOF\n")

    return buf.getvalue()


text = "Skills Python Django FastAPI PostgreSQL Docker Kubernetes AWS Machine Learning Git Linux"
pdf_bytes = make_skill_pdf(text)

# Save it
with open("skill_resume.pdf", "wb") as f:
    f.write(pdf_bytes)
print(f"Written {len(pdf_bytes)} bytes to skill_resume.pdf")

# Now verify extraction
from app.services.resume_parser import extract_text_from_pdf, extract_combined_skills

extracted_text = extract_text_from_pdf(pdf_bytes)
print("EXTRACTED TEXT:", repr(extracted_text[:300]))

skills = extract_combined_skills(extracted_text)
print("SKILLS FOUND:", skills)
print("COUNT:", len(skills))
