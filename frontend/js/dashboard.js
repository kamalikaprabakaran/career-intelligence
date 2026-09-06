// Dashboard-specific logic

const noProfileAlertEl = document.getElementById("no-profile-alert");
const dashboardContentEl = document.getElementById("dashboard-content");

// Profile elements
const profileNameEl = document.getElementById("profile-name");
const profileRoleEl = document.getElementById("profile-role");
const profileEduEl = document.getElementById("profile-edu");
const profileExpEl = document.getElementById("profile-exp");
const skillsCountEl = document.getElementById("skills-count");
const jobsMatchedEl = document.getElementById("jobs-matched");
const avgMatchEl = document.getElementById("avg-match");
const skillGapsCountEl = document.getElementById("skill-gaps-count");
const learningProgressEl = document.getElementById("learning-progress");
const recsContainerEl = document.getElementById("dashboard-recommendations-container");
const careerReadinessContainerEl = document.getElementById("career-readiness-container");
const topSkillsContainerEl = document.getElementById("top-skills-container");
const dashboardRoadmapContainerEl = document.getElementById("dashboard-roadmap-container");

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
            jobsMatchedEl.textContent = "0";
            avgMatchEl.textContent = "0%";
            skillGapsCountEl.textContent = "0";
            recsContainerEl.innerHTML = `
        <div class="status-msg">
          No job matches found for your current skills.<br>
          <a href="profile.html" style="color: var(--accent); text-decoration: underline;">Add skills</a> 
          or <a href="resume.html" style="color: var(--accent); text-decoration: underline;">upload a resume</a> to see recommendations.
        </div>
      `;
            return;
        }

        jobsMatchedEl.textContent = recommendations.length;
        const totalPct = recommendations.reduce((sum, rec) => sum + rec.match_percentage, 0);
        avgMatchEl.textContent = Math.round(totalPct / recommendations.length) + "%";

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


        // 4. Render Career Readiness
        const readinessPct = Math.round(top3[0].match_percentage);
        let readClass = readinessPct >= 80 ? "green" : (readinessPct >= 50 ? "yellow" : "red");
        careerReadinessContainerEl.innerHTML = `
            <div style="font-size: 0.95rem; color: var(--muted); margin-bottom: 8px;">Current Skill Coverage (Target 80%)</div>
            <div class="progress-container" style="height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                <div class="progress-fill fill-${readClass}" style="width: ${readinessPct}%; height: 100%; border-radius: 6px;"></div>
            </div>
            <div style="font-size: 1.1rem; font-weight: bold; color: var(--text);">${readinessPct}% Ready</div>
        `;

        // 5. Fetch Learning Progress based on the top job
        const topJobId = top3[0].job_id;
        try {
            const learnRes = await fetch(`${window.API_BASE_URL}/learning-recommendations/${userId}/${topJobId}`);
            if (learnRes.ok) {
                const learnData = await learnRes.json();
                const learningRecs = learnData.recommendations || [];
                skillGapsCountEl.textContent = learningRecs.length;

                // Read local storage progress
                const savedProgressRaw = localStorage.getItem(`roadmap_progress_${userId}`);
                const progressState = savedProgressRaw ? JSON.parse(savedProgressRaw) : {};

                if (learningRecs.length === 0) {
                    learningProgressEl.textContent = "100%";
                    topSkillsContainerEl.innerHTML = `<div class="status-msg" style="padding: 10px;">You are fully equipped for your top target job! No missing critical skills found.</div>`;
                    dashboardRoadmapContainerEl.innerHTML = `<div class="status-msg" style="padding: 10px;">Roadmap Complete!</div>`;
                } else {
                    const completedCount = learningRecs.filter(r => progressState[r.skill_name]).length;
                    const completionPct = Math.round((completedCount / learningRecs.length) * 100);
                    learningProgressEl.textContent = `${completionPct}%`;

                    // Render Top Skills to Learn chips
                    topSkillsContainerEl.innerHTML = learningRecs.slice(0, 4).map(r => `
                        <div style="background: rgba(255,255,255,0.05); color: ${r.importance === 'required' ? 'var(--error)' : 'var(--text)'}; border-radius: 4px; padding: 6px 12px; font-size: 0.85rem; border: 1px solid ${r.importance === 'required' ? 'rgba(255,95,109,0.3)' : 'var(--border)'};">
                            ${window.escapeHtml(r.skill_name)} ${r.importance === 'required' ? '(!)' : ''}
                        </div>
                    `).join("");

                    // Render Visual Roadmap Flowchart
                    const roadmapFlow = learningRecs.map((r, i) => {
                        const isDone = progressState[r.skill_name];
                        return `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="color: ${isDone ? 'var(--success)' : (i === 0 ? 'var(--accent)' : 'var(--muted)')}; font-size: 1rem;">
                                    ${isDone ? '✓' : (i === 0 ? '●' : '○')}
                                </div>
                                <div style="color: ${isDone ? 'var(--muted)' : (i === 0 ? 'var(--accent)' : 'var(--text)')}; font-weight: ${isDone ? '400' : '600'}; text-decoration: ${isDone ? 'line-through' : 'none'};">
                                    ${window.escapeHtml(r.skill_name)}
                                </div>
                            </div>
                            ${i < learningRecs.length - 1 ? `<div style="color: rgba(255,255,255,0.2);">&rarr;</div>` : ''}
                        `;
                    }).join("");
                    dashboardRoadmapContainerEl.innerHTML = roadmapFlow;
                }
            } else {
                learningProgressEl.textContent = "N/A";
                topSkillsContainerEl.innerHTML = `<div class="status-msg">Could not load missing skills.</div>`;
                dashboardRoadmapContainerEl.innerHTML = `<div class="status-msg">Could not load learning summary.</div>`;
            }
        } catch (e) {
            learningProgressEl.textContent = "N/A";
            topSkillsContainerEl.innerHTML = `<div class="status-msg">Error loading learning summary.</div>`;
            dashboardRoadmapContainerEl.innerHTML = `<div class="status-msg">Error loading learning summary.</div>`;
        }

    } catch (err) {
        console.error("Dashboard load error:", err);
        recsContainerEl.innerHTML = `<div class="status-msg error-msg">Error loading dashboard: ${window.escapeHtml(err.message)}</div>`;
        learningProgressEl.textContent = "Err";
        careerReadinessContainerEl.innerHTML = `<div class="status-msg error-msg">Error</div>`;
        topSkillsContainerEl.innerHTML = `<div class="status-msg error-msg">Error loading learning data</div>`;
        dashboardRoadmapContainerEl.innerHTML = `<div class="status-msg error-msg">Error loading learning data</div>`;
    }
}
