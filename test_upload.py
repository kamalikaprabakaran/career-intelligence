import requests

API_URL = "http://127.0.0.1:8000"

try:
    res = requests.get(f"{API_URL}/users")
    users = res.json()
    user_id = users[0]["id"]
except Exception as e:
    with open("result.txt", "w") as f:
        f.write(f"Users Error: {e}")
    exit(1)

import io
dummy_pdf = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 55\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Python Developer, API, SQL) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000293 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n397\n%%EOF\n"

res = requests.post(
    f"{API_URL}/users/{user_id}/resume",
    files={"file": ("dummy.pdf", io.BytesIO(dummy_pdf), "application/pdf")}
)
with open("result.txt", "w") as f:
    f.write(f"Status: {res.status_code}\n")
    f.write(f"Text: {res.text}\n")
