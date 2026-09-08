import base64
with open('skill_resume.pdf', 'rb') as f:
    print(base64.b64encode(f.read()).decode())
