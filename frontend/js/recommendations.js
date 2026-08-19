const API_BASE_URL = "http://127.0.0.1:8000";

const userSelectEl = document.getElementById("user-select");
const recommendationsSectionEl = document.getElementById("recommendations-section");
const recommendationsContainerEl = document.getElementById("recommendations-container");

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

// Fetch users and populate select dropdown
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (!res.ok) {
            throw new Error(`Failed to load users: ${res.statusText}`);
        }
        const users = await res.json();

        // Clear select
        userSelectEl.innerHTML = '<option value="" disabled selected>Select a user...</option>';

        if (users.length === 0) {
            userSelectEl.innerHTML = '<option value="" disabled>No users available. Create one first!</option>';
            return;
        }

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = `${user.name} (${user.email})`;
            userSelectEl.appendChild(option);
        });
    } catch (err) {
        console.error(err);
        userSelectEl.innerHTML = '<option value="" disabled>Error loading users</option>';
    }
}

// Fetch recommendations for selected user and render
async function loadRecommendations(userId) {
    recommendationsSectionEl.style.display = "block";
    recommendationsContainerEl.innerHTML = '<div class="status-msg">Loading recommendations...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/recommendations/${userId}`);
        if (!res.ok) {
            throw new Error(`Failed to load recommendations: ${res.statusText}`);
        }
        const data = await res.json();
        const recommendations = data.recommendations || [];

        if (recommendations.length === 0) {
            recommendationsContainerEl.innerHTML = '<div class="status-msg">No recommendations yet.</div>';
            return;
        }

        recommendationsContainerEl.innerHTML = "";

        recommendations.forEach(rec => {
            const card = document.createElement("div");
            card.className = "card";

            const pct = Math.round(rec.match_percentage);
            let matchClass = "red";
            if (pct >= 70) {
                matchClass = "green";
            } else if (pct >= 40) {
                matchClass = "yellow";
            }

            // Generate matched skills pills
            const matchedPills = rec.matched_skills.map(s =>
                `<span class="pill pill-matched">${escapeHtml(s)}</span>`
            ).join("");

            // Generate missing skills pills
            const missingPills = rec.missing_skills.map(s =>
                `<span class="pill pill-missing">${escapeHtml(s)}</span>`
            ).join("");

            card.innerHTML = `
        <div class="recommendation-header">
          <div>
            <h3 class="job-title">${escapeHtml(rec.job_title)}</h3>
            <p class="company-name">${escapeHtml(rec.company || "Unknown Company")}</p>
          </div>
          <span class="match-badge badge-${matchClass}">${pct}% Match</span>
        </div>

        <div class="progress-container">
          <div class="progress-fill fill-${matchClass}" style="width: ${pct}%"></div>
        </div>

        <div class="skills-block">
          <div class="skills-title">Matched Skills (${rec.matched_skills.length})</div>
          <div class="pills-container">
            ${matchedPills || '<span style="color: var(--muted); font-size: 0.85rem;">None</span>'}
          </div>
        </div>

        <div class="skills-block">
          <div class="skills-title">Missing Skills (${rec.missing_skills.length})</div>
          <div class="pills-container">
            ${missingPills || '<span style="color: var(--muted); font-size: 0.85rem;">None</span>'}
          </div>
        </div>
      `;
            recommendationsContainerEl.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        recommendationsContainerEl.innerHTML = `<div class="status-msg error-msg">Failed to load recommendations. Request failed: ${escapeHtml(err.message)}</div>`;
    }
}

// Event Listeners
userSelectEl.addEventListener("change", (e) => {
    const userId = e.target.value;
    if (userId) {
        loadRecommendations(userId);
    }
});

// Initialization
loadUsers();
