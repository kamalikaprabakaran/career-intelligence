# End-to-End Manual Testing Checklist for Career Intelligence

Follow this step-by-step checklist to verify that all systems—from resume upload and skill extraction to matching, prioritizing skill gaps, and rendering learning recommendations—are functioning correctly.

---

### Step 1: Create a New Test User
- [ ] **Method 1: Swagger**
  - Go to `GET /users` in Swagger to list existing users.
  - Expand **POST `/users`**, click **Try it out**, and execute with a fresh user schema:
    ```json
    {
      "name": "Jane Developer",
      "email": "jane.dev@example.com",
      "education": "B.S. Software Engineering",
      "target_role": "Backend Developer",
      "experience": "3 years"
    }
    ```
  - **Expected Correct Result**: Response is `201 Created` with a new user JSON object. Copy the `"id"` value (e.g., `a7c3b289-...`), which will be referred to as `USER_ID`.
- [ ] **Method 2: Frontend UI**
  - Open `http://localhost:5500/profile.html` (or dashboard landing page).
  - Fill in the form for **Jane Developer** and submit.
  - **Expected Correct Result**: The new profile is successfully created and populates the active navigation profile dropdown list as `"Jane Developer (Backend Developer - jane.dev@example.com)"`.

---

### Step 2: Upload a Resume PDF and Verify Skill Extraction
- [ ] **Swagger (POST `/users/{user_id}/resume`)**
  - Select the user's `USER_ID` in the path segment.
  - Upload a valid software engineering/developer resume PDF containing typical skill keywords (e.g. Python, SQL, Git, AWS). Click **Execute**.
  - **Expected Correct Result**: Response is `200 OK`. The `"extracted_skills"` array is non-empty and contains clean, normalized lowercase items like `["python", "sql", "git", "aws"]` containing no garbage punctuation (`##`, `@`, `,`, etc.).

---

### Step 3: Apply Resume Skills to the User's Profile
- [ ] **Swagger (POST `/users/{user_id}/resume/apply-skills`)**
  - Enter the `USER_ID` and execute.
  - **Expected Correct Result**: Response is `200 OK`. The JSON structure reflects `"added_skills"` count matching original extracted skills, and `"skipped_existing"` is `0` since this is a new profile.
- [ ] **Verification**: Run `POST /{user_id}/resume/apply-skills` a *second* time.
  - **Expected Correct Result**: Response returns `"added_skills": []` (empty array) and `"skipped_existing"` count matches the total skills list, guaranteeing duplicates are not created.

---

### Step 4: Manually Add Skills and Verify Retention
- [ ] **Swagger (POST `/users/{user_id}/skills`)**
  - Enter `USER_ID` and add a new manual skill (e.g., Docker):
    ```json
    {
      "skill_name": "Docker",
      "proficiency": "Intermediate",
      "years_experience": 2
    }
    ```
  - **Expected Correct Result**: Response code is `200 OK` housing the inserted skill.
- [ ] **Swagger (GET `/users/{user_id}/skills`)**
  - Execute and inspect the list.
  - **Expected Correct Result**: The returned array lists the manual skill (**docker**) alongside the applied resume skills.

---

### Step 5: Configure a Target Job's Requirements
- [ ] **Swagger (GET /jobs)**
  - Find an existing job's ID (e.g. `ab8933e9-eca3-4835-8574-0775009d938e` for AI Engineer, or `30e5e5c2-6c72-468b-8ae0-ecec223bb051` for Data Analyst) or create a new job using **POST `/jobs`**.
  - Let's create a new job for testing:
    ```json
    {
      "title": "Senior Systems Engineer",
      "company": "Infrastructure Corp",
      "location": "Dallas, TX",
      "description": "Looking for a systems engineer with experience in AWS, Kubernetes, Docker, and Python. Knowledge of ML/Machine Learning is preferred.",
      "experience": "5 years"
    }
    ```
  - Save the returned `"id"` as `JOB_ID`.
- [ ] **Swagger (GET `/jobs/{job_id}/skills`)**
  - Search or inspect the requirements for `JOB_ID`.
  - **Expected Correct Result**: Response is `200 OK`. Returns the list of requirements (AWS, Kubernetes, Docker, Python, ML / Machine Learning) parsed automatically by the job skill extractor service.

---

### Step 6: Verify Matching Logic & Math Consistency
- [ ] **Swagger (GET `/users/{user_id}/jobs/{job_id}/match`)**
  - Query with `USER_ID` (Jane Developer) and your new `JOB_ID`.
  - **Expected Correct Result**: Response code is `200 OK`. Spot-check the match math:
    - `match_percentage` = `(number of matched skills) / (total required and preferred job skills) * 100`.
    - Verification: If Jane has **python**, **aws**, and **docker** (3 matched) out of 5 total job skills (AWS, Kubernetes, Docker, Python, Machine Learning), the match percentage is exactly `60.0%`.

---

### Step 7: Verify Fuzzy Spellings and Alias Matching
- [ ] **Swagger (POST `/users/{user_id}/skills`)**
  - Add a skill containing an alias or slight variation of a required skill. For example:
    - Job requires: `"machine learning"`
    - Add user skill: `"ML"` or `"machine-learning"` (all aliases mapping to the normalized name `"machine learning"` in `SKILL_ALIASES`).
  - **Expected Correct Result**: Response code is `200 OK`.
- [ ] **Swagger (GET `/users/{user_id}/jobs/{job_id}/match`)**
  - Re-run the match check.
  - **Expected Correct Result**: The match score calculations rise, and `"machine learning"` is counted inside `"matched_skills"`. This confirms the layered exact -> alias -> fuzzy match pipeline operates correctly.

---

### Step 8: Verify Gaps Prioritization
- [ ] **Swagger (GET `/skill-gap/{user_id}/{job_id}`)**
  - Run the endpoint for the user and job.
  - **Expected Correct Result**: Response code is `200 OK`. Any missing skills designated as `"required"` in `job_skills` (e.g. `kubernetes`) MUST have a higher `priority_rank` (rank 1, 2) and appear earlier in the array than skills designated as `"preferred"` (e.g. `terraform` or preferred aliases).

---

### Step 9: Verify Job Recommendations Filters & Sort Orders
- [ ] **Swagger (GET `/recommendations/{user_id}`)**
  - Query options: `min_match = 20.0`, `limit = 2`.
  - **Expected Correct Result**: Response is `200 OK`.
    - Recommendations are sorted in descending order of match percentage (e.g. 60.0% appears before 40.0%).
    - No job card displays a match score below 20.0%.
    - Exactly 2 recommendations are returned, verifying the `limit` query parameter works correctly.

---

### Step 10: Verify AI Career Insights & Fallbacks
- [ ] **Swagger (GET `/insights/{user_id}/{job_id}`)**
  - Enter the IDs. If the AI LLM service endpoint returns a `404` (under active implementation) or a `200`:
    - **Expected 200 Result**: The explanation text contains references to active skills from the user profile, outlining strengths (matched skills e.g., Python, Docker) and weaknesses (missing skills e.g., Kubernetes). No hallucinated or placeholder skill names are present.
    - **Expected 404/Fail Fallback**: Inspect the frontend code's catch handler (`js/recommendations.js` line 221). It must generate and output an analytical fallback based on the match percentage without throwing a client crash:
      *Correct fallback representation:* `"This role is a 60% match based on your current profile containing 3 matching skills..."*

---

### Step 11: Verify Curated & Fallback Learning Resources
- [ ] **Swagger (GET `/learning-recommendations/{user_id}/{job_id}`)**
  - Enter the IDs to verify educational curation.
  - **Expected Correct Result**: Response is `200 OK`.
    - Missing required skills (e.g., `kubernetes`) are listed first.
    - Resources include actual URLs (e.g. KodeKloud for kubernetes).
    - Missing skills not in the curated datastore (e.g. a custom term you might insert) dynamically generate a search fallback link (e.g. `https://www.coursera.org/search?query=custom-term`).

---

### Step 12: End-to-End Frontend UI Flow Verification
- [ ] **Profile Page (`profile.html`)**
  - Create a user page. Fill fields. Submit. Confirm the profile is ready.
- [ ] **Upload Page (`resume.html`)**
  - Choose the user profile. Upload a PDF. Wait for extraction. Click **Apply Extracted Skills**.
  - **Expected Correct Result**: Extracted skills lists appear on the screen. Banner shows success toast/alert.
- [ ] **Recommendations Page (`recommendations.html`)**
  - Select the new user from the profile dropdown.
  - **Expected Correct Result**: The list of recommended jobs renders correctly. Click the **View Gap & AI Insights** button.
    - **Skill Gap Details**: Shows red missing pills for required skills, and grey missing pills for preferred skills, sorted by rank.
    - **AI Career Insights**: Displays strengths, growth areas, and recommendations, or the text-based backup on 404 (with loading spinner prior).
    - **Learning Paths**: Groups resources as clickable blue links (redirecting to Coursera search / curated Udemy course urls in a new tab) grouped clean under headers of missing skills.

---

### Step 13: Robust Error & Boundary Handlers (Failure Testing Cases)
- [ ] **Invalid User ID Query**
  - Enter `00000000-0000-0000-0000-000000000000` (clean UUID format) or `"bad-id-string"` as user ID on `/skill-gap` or `/insights`.
  - **Expected Correct Result**: The backend returns `404 Not Found` (for clean UUID) or `422 Unprocessable Entity` (if parsing failed). The server does not crash.
  - In frontend: Displays a clean error message: **"Failed to load details: Status 404 (User not found)"**.
- [ ] **Invalid File Upload**
  - On `/users/{user_id}/resume`, upload a text file (`.txt`) or image instead of a PDF.
  - **Expected Correct Result**: The backend returns `400 Bad Request` with `"detail": "Only PDF files are supported"`.
  - In frontend: Shows a visible red error message warning the user.
