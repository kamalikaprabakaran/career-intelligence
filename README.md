# 🎓 AI Career Intelligence

**AI-Powered Skill Gap Analysis and Fair Job Recommendation System**

An intelligent career platform that analyzes a student's resume, extracts their skills using AI, identifies gaps against target roles, and recommends the most suitable jobs — complete with a personalized learning roadmap to close those gaps.

> Domain: Artificial Intelligence & Machine Learning
> Aligned with **SDG 8** (Decent Work and Economic Growth) and **SDG 10** (Reduced Inequalities)

---

## 📖 Overview

Job seekers, especially students and early-career professionals, often don't know exactly which skills stand between them and the roles they want. **AI Career Intelligence** solves this in two connected parts:

**1. Skill Gap Analyzer** — *"What skills am I missing for the career I want?"*
Upload a resume, and the system extracts your skills automatically, compares them against a target role, and shows precisely what's missing.

**2. Fair Job Recommendation** — *"Which jobs are actually suitable for me?"*
The system ranks all available jobs by how well your skills match, using only job-relevant signals (skills, experience, education) — not irrelevant personal attributes.

```
                    STUDENT
                       │
                       ▼
              Resume / Profile
                       │
                       ▼
                AI Skill Extraction
                       │
                       ▼
               Student Skill Profile
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Skill Gap Analysis    Job Matching
             │                   │
             │              Fair Ranking
             │                   │
             └─────────┬─────────┘
                       ▼
              Skill Recommendations
                       │
                       ▼
              Personalized Roadmap
                       │
                       ▼
                 AI Assistant
```

---

## ✨ Features

- **Resume Upload & Parsing** — Upload a PDF resume; text is extracted automatically via `pypdf`.
- **Hybrid AI Skill Extraction** — Combines a curated skill dictionary (regex, word-boundary matching) with a pretrained NER model (Hugging Face transformers) to catch both common and domain-specific skills, with output cleaning to remove tokenizer artifacts and duplicates.
- **Skill Normalization** — Aliases like `ML → Machine Learning` and `SKLearn → Scikit-learn` are recognized as the same skill.
- **Smart Fuzzy Matching** — RapidFuzz-powered fuzzy matching catches near-misses and misspellings (e.g. `Pyhton` ≈ `Python`) beyond exact/alias matching alone.
- **Skill Gap Analysis** — Missing skills are prioritized by importance (`required` vs `preferred`), so users know what to learn first.
- **Fair Job Recommendation Engine** — Ranks every job in the database by match percentage, filterable by minimum match threshold and result count.
- **AI Career Insights** — LLM-generated, data-grounded explanations of match scores, strengths, and growth areas (explanations are built only from real matched/missing skill data, never invented).
- **Learning Recommendations** — Curated learning resources mapped to each missing skill, ordered by priority.
- **Personalized Learning Roadmap** — Visual, step-by-step roadmap with progress tracking; users can also add their own custom skills to learn.
- **Full Student-Facing UI** — Dashboard, profile, resume upload, job browser, recommendations, and roadmap pages, all connected to live backend data.

---

## 🛠️ Tech Stack

**Frontend**
- HTML, CSS, JavaScript (no framework/build step)

**Backend**
- Python + FastAPI

**Database & Storage**
- Supabase (PostgreSQL + Storage for resume files)

**AI / ML**
- `pypdf` — PDF text extraction
- Hugging Face `transformers` — NER-based skill extraction
- RapidFuzz — fuzzy string matching
- Rule-based skill dictionary + normalization/alias mapping
- LLM API — AI-generated career insights

**Deployment (planned)**
- Frontend → Vercel
- Backend → Render
- Database & Storage → Supabase

```
             ☁️ VERCEL
             FRONTEND
                 │
                 ▼
             ☁️ RENDER
              FASTAPI
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 ☁️ SUPABASE            AI APIs
 PostgreSQL               LLM
 Storage
```

---

## 📁 Project Structure

```
career-intelligence/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point, router registration
│   │   ├── config.py                # Settings loaded from .env
│   │   ├── database.py              # Shared Supabase client
│   │   │
│   │   ├── api/                     # Route handlers
│   │   │   ├── users.py
│   │   │   ├── skills.py
│   │   │   ├── jobs.py
│   │   │   ├── matching.py
│   │   │   ├── recommendations.py
│   │   │   ├── resumes.py
│   │   │   ├── insights.py
│   │   │   └── learning.py
│   │   │
│   │   ├── schemas/                 # Pydantic request/response models
│   │   │   ├── user.py
│   │   │   ├── skill.py
│   │   │   ├── job.py
│   │   │   ├── match.py
│   │   │   ├── recommendation.py
│   │   │   └── resume.py
│   │   │
│   │   └── services/                # Business logic
│   │       ├── matching.py          # Exact + alias + fuzzy skill matching
│   │       ├── skill_dictionary.py  # Known-skill list for rule-based extraction
│   │       ├── resume_parser.py     # PDF text + combined skill extraction
│   │       └── ai/
│   │           ├── skill_extractor.py    # NER-based extraction
│   │           └── career_insights.py    # LLM-generated explanations
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── index.html                   # Landing / create account
│   ├── dashboard.html                # Career overview, stats, top matches
│   ├── profile.html                  # User profile + skills
│   ├── upload-resume.html            # Resume upload & extraction
│   ├── jobs.html                     # Browse jobs
│   ├── recommendations.html          # Ranked job recommendations
│   ├── roadmap.html                  # Learning roadmap + progress tracking
│   ├── css/style.css
│   └── js/
│
├── data/
│   └── schema.sql                    # Supabase table definitions
│
├── docs/
│   └── testing-checklist.md          # End-to-end manual test guide
│
└── README.md
```

---

## 🗄️ Database Schema

Core tables in Supabase (PostgreSQL), all with Row Level Security enabled:

| Table | Purpose |
|---|---|
| `users` | Student profiles (name, email, education, target role, experience) |
| `user_skills` | Skills attached to a user (name, proficiency, years of experience) |
| `jobs` | Job postings (title, company, description, location, experience) |
| `job_skills` | Required/preferred skills per job, with importance level |
| `resumes` | Uploaded resume metadata, extracted text, and extracted skills |

Full definitions are in [`data/schema.sql`](data/schema.sql).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Clone the repository
```bash
git clone https://github.com/kamalikaprabakaran/career-intelligence.git
cd career-intelligence
```

### 2. Set up the database
In your Supabase project's **SQL Editor**, run the contents of `data/schema.sql` to create all required tables and policies.

Also create a **Storage bucket** named `resumes` (private), and add a storage policy allowing uploads — see `data/schema.sql` or the Supabase dashboard's Storage → Policies section.

### 3. Configure the backend
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-supabase-anon-or-legacy-key
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

> **Note:** Use a **legacy-format** Supabase API key (starts with `eyJ...`), as the version of `supabase-py` used here does not yet support the newer `sb_publishable_...` key format.

### 4. Run the backend
```bash
uvicorn app.main:app --reload
```
API runs at `http://127.0.0.1:8000` — interactive docs at `http://127.0.0.1:8000/docs`.

### 5. Run the frontend
```bash
cd frontend
python -m http.server 5500
```
Open `http://127.0.0.1:5500` in your browser.

> The frontend must be served (not opened as a `file://` path) for CORS to work correctly with the backend.

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users` | Create a user profile |
| `POST` | `/users/{user_id}/skills` | Add a skill manually |
| `POST` | `/users/{user_id}/resume` | Upload & parse a resume (PDF) |
| `POST` | `/users/{user_id}/resume/apply-skills` | Apply extracted resume skills to profile |
| `POST` | `/jobs` | Create a job listing |
| `POST` | `/jobs/{job_id}/skills` | Attach a required/preferred skill to a job |
| `GET` | `/match/{user_id}/{job_id}` | Matched/missing skills + match % for one job |
| `GET` | `/skill-gap/{user_id}/{job_id}` | Prioritized missing-skill breakdown |
| `GET` | `/recommendations/{user_id}` | Ranked job recommendations (supports `min_match`, `limit`) |
| `GET` | `/insights/{user_id}/{job_id}` | AI-generated explanation of match strengths/gaps |
| `GET` | `/learning-recommendations/{user_id}/{job_id}` | Learning resources for missing skills |

Full interactive documentation is available at `/docs` once the backend is running.

---

## 🧠 How Skill Matching Works

1. **Extraction** — Resume text is scanned two ways: a rule-based dictionary (regex, word-boundary matching to avoid false positives like `sql` inside `sqlite`) and a pretrained NER model. Results are merged, cleaned of tokenizer artifacts, and deduplicated.
2. **Normalization** — Known aliases (`ML` → `Machine Learning`, `SKLearn` → `Scikit-learn`, etc.) are collapsed to a single canonical skill name.
3. **Matching** — User skills are compared against job skills in three layers: exact match → alias match → RapidFuzz fuzzy match (for typos/near-misses), so genuinely different skills are never falsely matched.
4. **Gap Prioritization** — Missing skills are ranked by the job's stated importance (`required` before `preferred`).
5. **Recommendation** — Every job in the database is scored this way and ranked by match percentage for the user.

---

## 🧪 Testing

A full manual end-to-end testing checklist — covering resume upload → skill extraction → matching → recommendations → insights → learning resources, across both the API and the UI — is available at [`docs/testing-checklist.md`](docs/testing-checklist.md).

---

## 🗺️ Roadmap / Future Work

- [ ] Semantic (embedding-based) skill matching as an upgrade beyond fuzzy string matching
- [ ] Formal fairness evaluation (consistency checks with/without non-skill attributes)
- [ ] Persist roadmap progress server-side (currently browser `localStorage`)
- [ ] Real authentication (current profile system has no password/auth layer)
- [ ] Precision/Recall/F1 evaluation of skill extraction and job matching for the academic report
- [ ] Deployment to Vercel (frontend) + Render (backend)

---

## 📊 Evaluation (Planned Metrics)

| Component | Metrics |
|---|---|
| Resume skill extraction | Precision, Recall, F1-score |
| Job matching | Precision@K, Recall@K, F1-score |
| Recommendation | Relevance, Top-K accuracy |
| Fairness | Consistency of rankings with/without non-skill attributes |
| System | API response time, upload performance |

---

## ⚠️ Responsible AI Note

The recommendation engine is deliberately restricted to skill match, education requirements, relevant experience, target role, and location preference. It does not use — and should never be extended to use — irrelevant personal attributes to influence a candidate's 
## 🙋 Author

**Kamalika Prabakaran**
[GitHub](https://github.com/kamalikaprabakaran) · [Repository](https://github.com/kamalikaprabakaran/career-intelligence)
