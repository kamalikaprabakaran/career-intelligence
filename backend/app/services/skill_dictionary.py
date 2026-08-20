"""
A baseline list of known skills used to extract skills from resume text.
This is intentionally simple (keyword matching) - per the roadmap, we
build a working baseline first, then upgrade to spaCy/NLP-based
extraction later.

Add more skills here as you test with real resumes.
"""

KNOWN_SKILLS = [
    # Programming languages
    "python", "java", "javascript", "typescript", "c++", "c#", "dart", "swift", "kotlin", "sql",

    # Web
    "html", "css", "react", "angular", "vue", "node.js", "django", "flask", "fastapi",
    "rest api", "graphql", "websocket", "json",

    # Mobile
    "flutter", "swiftui", "android", "ios", "xcode", "android studio",

    # Architecture / state management
    "bloc", "mvvm", "mvc", "provider", "getx", "riverpod", "responsive ui design", "material design",

    # AI/ML/Data
    "machine learning", "deep learning", "nlp", "natural language processing",
    "data science", "data analysis", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "transformers",

    # Cloud / infra
    "docker", "kubernetes", "aws", "azure", "gcp", "firebase", "ci/cd",

    # Databases
    "postgresql", "mongodb", "mysql", "sqlite",

    # Tools
    "git", "github", "linux", "excel", "power bi", "tableau", "postman", "jira",

    # Process / methodology
    "agile", "scrum",

    # Soft skills
    "communication", "leadership", "problem solving",
]