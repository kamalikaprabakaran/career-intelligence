// Recommendations-specific logic

const noProfileAlertEl = document.getElementById("no-profile-alert");
const recommendationsSectionEl = document.getElementById("recommendations-section");
const recommendationsContainerEl = document.getElementById("recommendations-container");

// Listen for global user selection change from navigation.js
window.addEventListener("userSelectionChanged", (e) => {
    const userId = e.detail.userId;
    if (!userId) {
        showNoProfile();
    } else {
        loadRecommendations(userId);
    }
});

function showNoProfile() {
    noProfileAlertEl.style.display = "block";
    recommendationsSectionEl.style.display = "none";
}

// Fetch recommendations for selected user and render
async function loadRecommendations(userId) {
    noProfileAlertEl.style.display = "none";
    recommendationsSectionEl.style.display = "block";
    recommendationsContainerEl.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch(`${window.API_BASE_URL}/recommendations/${userId}`);
        if (!res.ok) {
            throw new Error(`Failed to load recommendations: ${res.statusText}`);
        }
        const data = await res.json();
        const recommendations = data.recommendations || [];

        recommendationsContainerEl.innerHTML = "";

        if (recommendations.length === 0) {
            recommendationsContainerEl.innerHTML = `
        <div class="status-msg">
          No job matches found for your current skills.<br>
          <a href="profile.html" style="color: var(--accent); text-decoration: underline;">Add skills</a> 
          or <a href="resume.html" style="color: var(--accent); text-decoration: underline;">upload a resume</a> to see recommendations.
        </div>
      `;
            return;
        }

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
                `<span class="pill pill-matched">${window.escapeHtml(s)}</span>`
            ).join("");

            // Generate missing skills pills
            const missingPills = rec.missing_skills.map(s =>
                `<span class="pill pill-missing">${window.escapeHtml(s)}</span>`
            ).join("");

            card.innerHTML = `
        <div class="recommendation-header">
          <div>
            <h3 class="job-title">${window.escapeHtml(rec.job_title)}</h3>
            <p class="company-name">${window.escapeHtml(rec.company || "Unknown Company")}</p>
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
        recommendationsContainerEl.innerHTML = `<div class="status-msg error-msg">Failed to load recommendations. Request failed: ${window.escapeHtml(err.message)}</div>`;
    }
}
