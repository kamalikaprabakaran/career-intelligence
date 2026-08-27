// Profile-specific logic

const noProfileAlertEl = document.getElementById("no-profile-alert");
const profileContentEl = document.getElementById("profile-content");

// Prof details elements
const profNameEl = document.getElementById("prof-name");
const profRoleEl = document.getElementById("prof-role");
const profEmailEl = document.getElementById("prof-email");
const profEduEl = document.getElementById("prof-edu");
const profExpEl = document.getElementById("prof-exp");

// Skills section elements
const skillsSectionEl = document.getElementById("skills-section");
const toggleSkillFormBtn = document.getElementById("toggle-skill-form-btn");
const skillFormEl = document.getElementById("skill-form");
const addSkillSubmitBtn = document.getElementById("add-skill-submit-btn");
const skillResultEl = document.getElementById("skill-result");
const skillsListEl = document.getElementById("skills-list");

let currentUserId = null;

// Listen for global user change from navigation.js
window.addEventListener("userSelectionChanged", async (e) => {
    currentUserId = e.detail.userId;
    if (!currentUserId) {
        showNoProfile();
    } else {
        await loadProfileData(currentUserId);
    }
});

function showNoProfile() {
    noProfileAlertEl.style.display = "block";
    profileContentEl.style.display = "none";
}

async function loadProfileData(userId) {
    noProfileAlertEl.style.display = "none";
    profileContentEl.style.display = "block";
    skillsListEl.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch Profile Data
        const userRes = await fetch(`${window.API_BASE_URL}/users/${userId}`);
        if (!userRes.ok) throw new Error("Failed to fetch user profiles");
        const user = await userRes.json();

        profNameEl.textContent = window.escapeHtml(user.name || "Unnamed User");
        profRoleEl.textContent = window.escapeHtml(user.target_role || "Not specified");
        profEmailEl.textContent = window.escapeHtml(user.email || "-");
        profEduEl.textContent = window.escapeHtml(user.education || "Not specified");
        profExpEl.textContent = window.escapeHtml(user.experience || "Not specified");

        // 2. Load User Skills List
        await loadUserSkills(userId);

    } catch (err) {
        console.error("Profile load error:", err);
        skillsListEl.innerHTML = `<div class="status-msg error-msg">Error loading profile: ${window.escapeHtml(err.message)}</div>`;
    }
}

// Fetch and display user skills
async function loadUserSkills(userId) {
    try {
        const res = await fetch(`${window.API_BASE_URL}/users/${userId}/skills`);
        if (res.ok) {
            const skills = await res.json();
            skillsListEl.innerHTML = "";
            if (skills.length === 0) {
                skillsListEl.innerHTML = `<li style="color: var(--muted); font-size: 0.9rem; list-style: none; padding: 12px 0;">No skills added yet. Add some manually or upload your resume!</li>`;
                return;
            }
            skills.forEach(skill => {
                const li = document.createElement("li");
                li.className = "skill-item";

                // Handle singular/plural years
                const yearsStr = skill.years_experience === 1 ? "1 year" : `${skill.years_experience} years`;

                li.innerHTML = `
          <div class="skill-name">${window.escapeHtml(skill.skill_name)}</div>
          <div class="skill-details">${window.escapeHtml(skill.proficiency)} &bull; ${yearsStr}</div>
        `;
                skillsListEl.appendChild(li);
            });
        } else {
            skillsListEl.innerHTML = `<div class="status-msg error-msg">Failed to load skills list.</div>`;
        }
    } catch (err) {
        console.error("Failed to load skills:", err);
        skillsListEl.innerHTML = `<div class="status-msg error-msg">Request failed: ${window.escapeHtml(err.message)}</div>`;
    }
}

// Toggle Skill Form visibility
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

// Submit Manual Skill entry Form
skillFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUserId) return;

    addSkillSubmitBtn.disabled = true;
    addSkillSubmitBtn.textContent = "Adding...";
    skillResultEl.style.display = "none";

    const payload = {
        skill_name: document.getElementById("skill_name").value.trim(),
        proficiency: document.getElementById("proficiency").value,
        years_experience: parseFloat(document.getElementById("years_experience").value) || 0
    };

    try {
        const res = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/skills`, {
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

            // Auto close form
            skillFormEl.style.display = "none";
            toggleSkillFormBtn.textContent = "+ Add Skill";

            // Reload skill list
            await loadUserSkills(currentUserId);
        } else {
            skillResultEl.className = "error";
            skillResultEl.textContent = "Error adding skill: " + (data.detail || JSON.stringify(data));
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
