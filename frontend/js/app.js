// Change this if your backend runs somewhere else (e.g. your Render URL later)
const API_BASE_URL = "http://127.0.0.1:8000";

const dbStatusEl = document.getElementById("db-status");
const formEl = document.getElementById("user-form");
const resultEl = document.getElementById("result");
const submitBtn = document.getElementById("submit-btn");

// User Skills DOM elements & state
let currentUserId = null;
const skillsSectionEl = document.getElementById("skills-section");
const toggleSkillFormBtn = document.getElementById("toggle-skill-form-btn");
const skillFormEl = document.getElementById("skill-form");
const addSkillSubmitBtn = document.getElementById("add-skill-submit-btn");
const skillResultEl = document.getElementById("skill-result");
const skillsListEl = document.getElementById("skills-list");

// Check FastAPI <-> Supabase connection on page load (Step 6 of the roadmap)
async function checkDbHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health/db`);
    const data = await res.json();

    if (data.status === "ok") {
      dbStatusEl.innerHTML = `<span class="status-dot ok"></span>Connected to Supabase`;
    } else {
      dbStatusEl.innerHTML = `<span class="status-dot error"></span>Backend up, Supabase not connected`;
    }
  } catch (err) {
    dbStatusEl.innerHTML = `<span class="status-dot error"></span>Backend not reachable at ${API_BASE_URL}`;
  }
}

// Helpers
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Fetch and display user skills
async function loadUserSkills() {
  if (!currentUserId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/users/${currentUserId}/skills`);
    if (res.ok) {
      const skills = await res.json();
      skillsListEl.innerHTML = "";
      if (skills.length === 0) {
        skillsListEl.innerHTML = `<li style="color: var(--muted); font-size: 0.9rem; list-style: none;">No skills added yet.</li>`;
        return;
      }
      skills.forEach(skill => {
        const li = document.createElement("li");
        li.className = "skill-item";

        const yearsStr = skill.years_experience === 1 ? "1 year" : `${skill.years_experience} years`;

        li.innerHTML = `
          <div class="skill-name">${escapeHtml(skill.skill_name)}</div>
          <div class="skill-details">${escapeHtml(skill.proficiency)} &bull; ${yearsStr}</div>
        `;
        skillsListEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Failed to load skills:", err);
  }
}

// Toggle Skill Form
toggleSkillFormBtn.addEventListener("click", () => {
  if (skillFormEl.style.display === "none") {
    skillFormEl.style.display = "block";
    toggleSkillFormBtn.textContent = "Cancel";
  } else {
    skillFormEl.style.display = "none";
    toggleSkillFormBtn.textContent = "+ Add Skill";
    skillFormEl.reset();
  }
});

// Submit Skill Form
skillFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUserId) return;

  addSkillSubmitBtn.disabled = true;
  addSkillSubmitBtn.textContent = "Adding...";
  skillResultEl.style.display = "none";

  const payload = {
    skill_name: document.getElementById("skill_name").value,
    proficiency: document.getElementById("proficiency").value,
    years_experience: parseFloat(document.getElementById("years_experience").value) || 0
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users/${currentUserId}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      skillResultEl.className = "ok";
      skillResultEl.textContent = "Skill added successfully!";
      skillResultEl.style.display = "block";

      skillFormEl.reset();
      await loadUserSkills();
    } else {
      skillResultEl.className = "error";
      skillResultEl.textContent = "Error: " + (data.detail || JSON.stringify(data));
      skillResultEl.style.display = "block";
    }
  } catch (err) {
    skillResultEl.className = "error";
    skillResultEl.textContent = "Request failed: " + err.message;
    skillResultEl.style.display = "block";
  } finally {
    addSkillSubmitBtn.disabled = false;
    addSkillSubmitBtn.textContent = "Add Skill";
  }
});

// Step 7 of the roadmap: POST /users and confirm it appears in Supabase
formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";
  resultEl.style.display = "none";

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    education: document.getElementById("education").value || null,
    target_role: document.getElementById("target_role").value || null,
    experience: document.getElementById("experience").value || null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      resultEl.className = "ok";
      resultEl.textContent = "User created:\n" + JSON.stringify(data, null, 2);
      resultEl.style.display = "block";

      // Store user ID and show skills section
      currentUserId = data.id;
      skillsSectionEl.style.display = "block";
      await loadUserSkills();

      formEl.reset();
    } else {
      resultEl.className = "error";
      resultEl.textContent = "Error:\n" + JSON.stringify(data, null, 2);
      resultEl.style.display = "block";
    }
  } catch (err) {
    resultEl.className = "error";
    resultEl.textContent = "Request failed: " + err.message;
    resultEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create User";
  }
});

checkDbHealth();