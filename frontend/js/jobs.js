// Jobs-specific logic

const publishTriggerEl = document.getElementById("publish-trigger");
const publishArrowEl = document.getElementById("publish-arrow");
const publishContentEl = document.getElementById("publish-content");

const jobFormEl = document.getElementById("job-form");
const jobResultEl = document.getElementById("job-result");
const createJobBtn = document.getElementById("create-job-btn");

const skillsSubformSectionEl = document.getElementById("job-skills-subform-section");
const targetCreatedJobTitleEl = document.getElementById("target-created-job-title");
const jobSkillsFormEl = document.getElementById("job-skills-form");
const addJobSkillBtn = document.getElementById("add-job-skill-btn");
const jobConfiguredSkillsEl = document.getElementById("job-configured-skills");
const donePostingBtn = document.getElementById("done-posting-btn");

const jobsListContainerEl = document.getElementById("jobs-list-container");

let activeCreatedJobId = null;
let activeCreatedJobTitle = "";
let currentSessionSkills = [];

// Expand/Collapse Post Job Card
publishTriggerEl.addEventListener("click", () => {
    const isCollapsed = publishContentEl.classList.contains("collapsed");
    if (isCollapsed) {
        publishContentEl.classList.remove("collapsed");
        publishArrowEl.innerHTML = "&darr;";
    } else {
        publishContentEl.classList.add("collapsed");
        publishArrowEl.innerHTML = "&rarr;";
    }
});

// Load and Renders All Jobs
async function loadJobs() {
    jobsListContainerEl.innerHTML = '<div class="spinner"></div>';
    try {
        const res = await fetch(`${window.API_BASE_URL}/jobs`);
        if (!res.ok) throw new Error("Failed to fetch jobs listing");
        const jobs = await res.json();

        jobsListContainerEl.innerHTML = "";
        if (jobs.length === 0) {
            jobsListContainerEl.innerHTML = '<div class="status-msg">No job openings published yet. Use the tool above to add some!</div>';
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "card job-card-clickable";
            card.dataset.jobId = job.id;

            card.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
                <h3 class="job-title" style="font-size: 1.25rem; font-weight: 700; color: var(--text); margin-bottom: 6px;">${window.escapeHtml(job.title)}</h3>
                <p class="company-name" style="font-size: 0.95rem; font-weight: 500; color: var(--accent); margin-bottom: 12px;">${window.escapeHtml(job.company || "Unknown Company")}</p>
                
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: var(--muted); margin-bottom: 16px;">
                    <span style="display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> ${window.escapeHtml(job.location || "Remote")}</span>
                    <span style="display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg> ${window.escapeHtml(job.experience || "Experience not specified")}</span>
                </div>
            </div>
            
            <div style="border-top: 1px dashed var(--border); padding-top: 12px; margin-top: auto;">
                <div style="font-size: 0.8rem; color: var(--accent); font-weight: 600; text-align: center; text-transform: uppercase;">View Requirements &rarr;</div>
            </div>

            <div class="job-skills-detail" style="display: none; padding-top: 12px; border-top: 1px solid var(--border); margin-top: 12px;" id="skills-detail-${job.id}">
                <div class="skills-title">Required Skills</div>
                <div class="pills-container" id="pills-container-${job.id}" style="display:flex; flex-wrap:wrap; gap:8px;">
                    <div class="spinner" style="margin: 8px 0; width:16px; height:16px; border-width:2px;"></div>
                </div>
            </div>
        </div>
      `;

            card.addEventListener("click", (e) => {
                // Prevent click if clicking inside dynamic skill pills
                if (e.target.closest(".pill")) return;
                toggleJobSkills(job.id);
            });

            jobsListContainerEl.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        jobsListContainerEl.innerHTML = `<div class="status-msg error-msg">Error loading jobs: ${window.escapeHtml(err.message)}</div>`;
    }
}

// Collapsible Skill details for each job card
async function toggleJobSkills(jobId) {
    const detailEl = document.getElementById(`skills-detail-${jobId}`);
    const pillsContainer = document.getElementById(`pills-container-${jobId}`);

    if (detailEl.style.display === "none") {
        detailEl.style.display = "block";

        // Check if skills are already loaded (to avoid re-fetching)
        if (pillsContainer.querySelector(".spinner")) {
            try {
                const res = await fetch(`${window.API_BASE_URL}/jobs/${jobId}/skills`);
                if (!res.ok) throw new Error("Failed to load skills for job");
                const skillsObj = await res.json();

                pillsContainer.innerHTML = "";
                if (skillsObj.length === 0) {
                    pillsContainer.innerHTML = '<span style="color: var(--muted); font-size: 0.85rem;">No specific skills configured for this job opening.</span>';
                    return;
                }

                skillsObj.forEach(sk => {
                    const span = document.createElement("span");
                    span.className = "pill pill-matched"; // Green style
                    span.textContent = `${sk.skill_name} (${sk.importance || 'Required'})`;
                    pillsContainer.appendChild(span);
                });
            } catch (err) {
                console.error(err);
                pillsContainer.innerHTML = `<span style="color: var(--error); font-size:0.85rem;">Error: ${window.escapeHtml(err.message)}</span>`;
            }
        }
    } else {
        detailEl.style.display = "none";
    }
}

// Create Job submission handler
jobFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    createJobBtn.disabled = true;
    createJobBtn.textContent = "Publishing...";
    jobResultEl.style.display = "none";

    const payload = {
        title: document.getElementById("job_title").value.trim(),
        company: document.getElementById("company").value.trim(),
        location: document.getElementById("location").value.trim() || null,
        experience: document.getElementById("job_experience").value.trim() || null
    };

    try {
        const res = await fetch(`${window.API_BASE_URL}/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to create job");

        jobResultEl.className = "status-msg ok";
        jobResultEl.textContent = `Job "${data.title}" successfully created! Now configure its skill requirements below.`;
        jobResultEl.style.display = "block";

        // Set up skills sub-form
        activeCreatedJobId = data.id;
        activeCreatedJobTitle = data.title;
        targetCreatedJobTitleEl.textContent = activeCreatedJobTitle;

        currentSessionSkills = [];
        jobConfiguredSkillsEl.innerHTML = "";

        // Hide job creation input, display skills configurator
        jobFormEl.style.display = "none";
        skillsSubformSectionEl.style.display = "block";

        // Refresh underlying jobs list
        await loadJobs();
    } catch (err) {
        console.error(err);
        jobResultEl.className = "status-msg error-msg";
        jobResultEl.textContent = "Error publishing job: " + err.message;
        jobResultEl.style.display = "block";
    } finally {
        createJobBtn.disabled = false;
        createJobBtn.textContent = "Publish Job Opening";
    }
});

// Add Skills to newly Created Job handler
jobSkillsFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeCreatedJobId) return;

    addJobSkillBtn.disabled = true;
    addJobSkillBtn.textContent = "Adding...";

    const skillName = document.getElementById("job_skill_name").value.trim();
    const importance = document.getElementById("importance").value;

    const payload = {
        skill_name: skillName,
        importance: importance
    };

    try {
        const res = await fetch(`${window.API_BASE_URL}/jobs/${activeCreatedJobId}/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to add job skill");

        // Add pill in current session view
        const pill = document.createElement("span");
        pill.className = "pill pill-matched";
        pill.textContent = `${data.skill_name} (${data.importance})`;
        jobConfiguredSkillsEl.appendChild(pill);

        // Reset skill input
        document.getElementById("job_skill_name").value = "";
        document.getElementById("job_skill_name").focus();
    } catch (err) {
        console.error(err);
        alert("Could not append job skill: " + err.message);
    } finally {
        addJobSkillBtn.disabled = false;
        addJobSkillBtn.textContent = "Add Skill";
    }
});

// Done Posting Job action
donePostingBtn.addEventListener("click", () => {
    // Reset view to original state
    activeCreatedJobId = null;
    activeCreatedJobTitle = "";
    currentSessionSkills = [];

    skillsSubformSectionEl.style.display = "none";
    jobFormEl.style.display = "block";
    jobFormEl.reset();
    jobResultEl.style.display = "none";

    // Collapse section
    publishContentEl.classList.add("collapsed");
    publishArrowEl.innerHTML = "&rarr;";
});

// Run
loadJobs();
