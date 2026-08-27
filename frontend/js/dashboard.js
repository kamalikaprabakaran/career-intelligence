// Dashboard-specific logic

const noProfileAlertEl = document.getElementById("no-profile-alert");
const dashboardContentEl = document.getElementById("dashboard-content");

// Profile elements
const profileNameEl = document.getElementById("profile-name");
const profileRoleEl = document.getElementById("profile-role");
const profileEduEl = document.getElementById("profile-edu");
const profileExpEl = document.getElementById("profile-exp");
const profileEmailEl = document.getElementById("profile-email");
const skillsCountEl = document.getElementById("skills-count");
const recsContainerEl = document.getElementById("dashboard-recommendations-container");

// Listen for global user change from navigation.js
window.addEventListener("userSelectionChanged", async (e) => {
    const userId = e.detail.userId;
    if (!userId) {
        showNoProfile();
    } else {
        await loadDashboardData(userId);
    }
});

function showNoProfile() {
    noProfileAlertEl.style.display = "block";
    dashboardContentEl.style.display = "none";
}

async function loadDashboardData(userId) {
    noProfileAlertEl.style.display = "none";
    dashboardContentEl.style.display = "block";
    recsContainerEl.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch Profile Data
        const userRes = await fetch(`${window.API_BASE_URL}/users/${userId}`);
        if (!userRes.ok) throw new Error("Failed to fetch user general profile details");
        const user = await userRes.json();

        profileNameEl.textContent = window.escapeHtml(user.name || "Unnamed User");
        profileRoleEl.textContent = window.escapeHtml(user.target_role || "Not specified");
        profileEduEl.textContent = window.escapeHtml(user.education || "Not specified");
        profileExpEl.textContent = window.escapeHtml(user.experience || "Not specified");
        profileEmailEl.textContent = window.escapeHtml(user.email || "-");

        // 2. Fetch Skill Count
        const skillsRes = await fetch(`${window.API_BASE_URL}/users/${userId}/skills`);
        if (skillsRes.ok) {
            const skills = await skillsRes.json();
            skillsCountEl.textContent = skills.length;
        } else {
            skillsCountEl.textContent = "Error";
        }

        // 3. Fetch Top 3 job matches
        const recsRes = await fetch(`${window.API_BASE_URL}/recommendations/${userId}`);
        if (!recsRes.ok) throw new Error("Failed to fetch recommendations");
        const recsData = await recsRes.json();
        const recommendations = recsData.recommendations || [];

        recsContainerEl.innerHTML = "";
        if (recommendations.length === 0) {
            recsContainerEl.innerHTML = `
        <div class="status-msg">
          No job matches found for your current skills.<br>
          <a href="profile.html" style="color: var(--accent); text-decoration: underline;">Add skills</a> 
          or <a href="resume.html" style="color: var(--accent); text-decoration: underline;">upload a resume</a> to see recommendations.
        </div>
      `;
            return;
        }

        // Take top 3
        const top3 = recommendations.slice(0, 3);
        top3.forEach(rec => {
            const dev = document.createElement("div");
            dev.className = "card";
            dev.style.marginTop = "12px";
            dev.style.padding = "16px";

            const pct = Math.round(rec.match_percentage);
            let matchClass = "red";
            if (pct >= 70) {
                matchClass = "green";
            } else if (pct >= 40) {
                matchClass = "yellow";
            }

            dev.innerHTML = `
        <div class="recommendation-header" style="margin-bottom: 8px;">
          <div>
            <h3 class="job-title" style="font-size: 1rem; margin:0 0 2px 0;">${window.escapeHtml(rec.job_title)}</h3>
            <p class="company-name" style="font-size: 0.8rem; margin:0;">${window.escapeHtml(rec.company || "Unknown Company")}</p>
          </div>
          <span class="match-badge badge-${matchClass}" style="padding: 2px 6px; font-size: 0.75rem;">${pct}% Match</span>
        </div>
        <div class="progress-container" style="margin: 8px 0 0 0; height: 6px;">
          <div class="progress-fill fill-${matchClass}" style="width: ${pct}%"></div>
        </div>
      `;
            recsContainerEl.appendChild(dev);
        });

    } catch (err) {
        console.error("Dashboard load error:", err);
        recsContainerEl.innerHTML = `<div class="status-msg error-msg">Error loading dashboard: ${window.escapeHtml(err.message)}</div>`;
    }
}
