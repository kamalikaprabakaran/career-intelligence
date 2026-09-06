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
    const userRes = await fetch(`${window.API_BASE_URL}/users/${userId}`);
    if (userRes.ok) {
      const user = await userRes.json();
      const activeNameEl = document.getElementById("active-profile-name");
      if (activeNameEl) {
        activeNameEl.textContent = `Recommendations for ${window.escapeHtml(user.name)}`;
      }
    }

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

        <div class="skills-block" style="margin-bottom: 16px;">
          <div class="skills-title">Missing Skills (${rec.missing_skills.length})</div>
          <div class="pills-container">
            ${missingPills || '<span style="color: var(--muted); font-size: 0.85rem;">None</span>'}
          </div>
        </div>

        <button class="btn-secondary toggle-details-btn" data-job-id="${rec.job_id}" style="margin-top: 16px; font-size: 0.85rem; padding: 8px 16px; width: auto; display: block;">View Gap & AI Insights</button>
        
        <div id="details-${rec.job_id}" class="details-panel" style="display: none; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
            <!-- Content dynamically elements -->
        </div>
      `;

      const btnEl = card.querySelector(".toggle-details-btn");
      const detailsPanelEl = card.querySelector(".details-panel");
      let isLoaded = false;

      btnEl.addEventListener("click", () => {
        const isHidden = detailsPanelEl.style.display === "none";
        if (isHidden) {
          detailsPanelEl.style.display = "block";
          btnEl.textContent = "Hide details";
          if (!isLoaded) {
            loadDetailsPanel(userId, rec.job_id, detailsPanelEl, rec);
            isLoaded = true;
          }
        } else {
          detailsPanelEl.style.display = "none";
          btnEl.textContent = "View Gap & AI Insights";
        }
      });

      recommendationsContainerEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    recommendationsContainerEl.innerHTML = `<div class="status-msg error-msg">Failed to load recommendations. Request failed: ${window.escapeHtml(err.message)}</div>`;
  }
}

// Helper to return dynamic platform recommendations and tips
function getSkillPlatformAndTip(skillName) {
  const skill = (skillName || "").trim().toLowerCase();
  let platform = "Coursera";
  let tip = "Begin with a foundational course, complete custom coding labs, and build a simple portfolio project.";

  if (skill.includes("python") || skill.includes("javascript") || skill.includes("ts") || skill.includes("node") || skill.includes("js")) {
    platform = "Udemy / MDN Web Docs / freeCodeCamp";
    tip = "Practice basic language syntax and complete simple algorithms on LeetCode/HackerRank.";
  } else if (skill.includes("aws") || skill.includes("kubernetes") || skill.includes("docker") || skill.includes("devops") || skill.includes("terraform")) {
    platform = "KodeKloud / AWS Skill Builder / YouTube Labs";
    tip = "Build a local Minikube/Docker sandbox or sign up for a cloud free-tier to provision containers manually.";
  } else if (skill.includes("machine learning") || skill.includes("ml") || skill.includes("deep learning") || skill.includes("tensorflow") || skill.includes("pytorch") || skill.includes("pandas") || skill.includes("numpy")) {
    platform = "Kaggle / Coursera (DeepLearning.AI)";
    tip = "Study Jupyter Notebook structures, join a beginner-level Kaggle data competition, and work on data cleaning workshops.";
  } else if (skill.includes("sql") || skill.includes("postgres") || skill.includes("database")) {
    platform = "Mode Analytics / LeetCode SQL / w3schools";
    tip = "Practice writing complex queries involving joins, window functions, and subqueries on mock database datasets.";
  } else if (skill.includes("power bi") || skill.includes("tableau") || skill.includes("excel")) {
    platform = "Microsoft Learn / Tableau Public Tutorials";
    tip = "Build visual dashboard reports and use Power Query to practice basic ETL data cleaning steps.";
  } else if (skill.includes("git") || skill.includes("github")) {
    platform = "GitHub Learning Lab / YouTube Hub";
    tip = "Create a repository and practice branch checkouts, merging, pushing, and merge-conflict resolution.";
  }

  return { platform, tip };
}

// Dynamically populates the collapsible detailed layout
async function loadDetailsPanel(userId, jobId, containerEl, rec) {
  // If there are no missing skills (perfect match), render instantly and skip extra backend calls
  if (!rec.missing_skills || rec.missing_skills.length === 0) {
    containerEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Skill Gap Details -->
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);">Skill Gap Details</h4>
                <div style="color: var(--muted); font-size: 0.85rem;">🎉 No skill gaps identified. Perfect match!</div>
            </div>
            
            <!-- AI Insights -->
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);">AI Career Insights</h4>
                <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text);">
                    <p style="margin: 0 0 12px 0; color: var(--muted); font-style: italic;">This role is a 100% match based on your current profile.</p>
                    <div style="margin-bottom: 10px;">
                        <strong style="color: var(--success); display: block; margin-bottom: 4px;">Strengths:</strong>
                        <ul style="margin: 0; padding: 0;"><li style="margin-left: 20px; list-style-type: disc;">You fully possess all requirements listed for this job.</li></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    return;
  }

  containerEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Skill Gap Details -->
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);">Skill Gap Details</h4>
                <div id="skill-gap-${jobId}">
                    <div class="spinner" style="margin: 10px auto; width: 16px; height: 16px; border-width: 2px;"></div>
                </div>
            </div>
            
            <!-- AI Insights -->
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);">AI Career Insights</h4>
                <div id="insights-${jobId}">
                    <div class="spinner" style="margin: 10px auto; width: 16px; height: 16px; border-width: 2px;"></div>
                </div>
            </div>
        </div>
    `;

  const skillGapEl = containerEl.querySelector(`#skill-gap-${jobId}`);
  const insightsEl = containerEl.querySelector(`#insights-${jobId}`);

  // Call Endpoints in parallel
  fetchSkillGapsWithResources(userId, jobId, skillGapEl);
  fetchAIInsights(userId, jobId, insightsEl, rec);
}

async function fetchSkillGapsWithResources(userId, jobId, element) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/learning-recommendations/${userId}/${jobId}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const recommendations = data.recommendations || [];

    if (recommendations.length === 0) {
      element.innerHTML = `<span style="color: var(--muted); font-size: 0.85rem;">No skill gaps identified. Perfect match!</span>`;
      return;
    }

    const listHtml = recommendations.map(gap => {
      const isReq = gap.importance === "required";
      const badgeClass = isReq ? "pill-missing" : "pill";
      const style = isReq
        ? "border: 1px solid rgba(255, 95, 109, 0.4); font-weight: bold; background: rgba(255, 95, 109, 0.15); font-size: 0.7rem; padding: 2px 6px;"
        : "border: 1px solid rgba(154, 161, 174, 0.2); background: rgba(154, 161, 174, 0.05); color: var(--muted); font-size: 0.7rem; padding: 2px 6px;";

      const resourcesHtml = gap.resources.map(res =>
        `<a href="${window.escapeHtml(res.url)}" target="_blank" rel="noopener" style="color: var(--accent); font-size: 0.85rem; text-decoration: none; margin-left: 8px;">[${window.escapeHtml(res.title)}]</a>`
      ).join(" ");

      return `
                <div style="display: flex; flex-direction: column; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; background: rgba(255, 255, 255, 0.01); margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 0.85rem;">Rank ${gap.priority_rank}: <strong style="color: var(--text);">${window.escapeHtml(gap.skill_name)}</strong></span>
                        <span class="pill ${badgeClass}" style="${style}">${isReq ? 'REQUIRED' : 'PREFERRED'}</span>
                    </div>
                    ${gap.resources.length > 0 ? `<div style="font-size: 0.85rem; color: var(--muted);"> &rarr; Start learning: ${resourcesHtml}</div>` : ''}
                </div>
            `;
    }).join("");

    element.innerHTML = listHtml;
  } catch (err) {
    console.warn("Skill gaps fetch error:", err);
    element.innerHTML = `<div class="status-msg error-msg" style="padding: 10px; font-size: 0.85rem; background: rgba(255, 95, 109, 0.1); border: 1px solid rgba(255, 95, 109, 0.4); border-radius: 6px; color: var(--error);">Failed to load skill gap details due to a network or server issue. Please try again.</div>`;
  }
}

async function fetchAIInsights(userId, jobId, element, rec) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/insights/${userId}/${jobId}`);
    let data;
    if (!res.ok) {
      data = generateFallbackInsights(rec);
    } else {
      data = await res.json();
    }

    const strengthsHtml = (data.strengths || []).map(s =>
      `<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">${window.escapeHtml(s)}</li>`
    ).join("");

    const weaknessesHtml = (data.weaknesses || []).map(w =>
      `<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">${window.escapeHtml(w)}</li>`
    ).join("");

    element.innerHTML = `
            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text);">
                <p style="margin: 0 0 12px 0; color: var(--muted); font-style: italic;">${window.escapeHtml(data.explanation)}</p>
                <div style="margin-bottom: 10px;">
                    <strong style="color: var(--success); display: block; margin-bottom: 4px;">Strengths:</strong>
                    <ul style="margin: 0; padding: 0;">${strengthsHtml || '<span style="color: var(--muted);">None identified.</span>'}</ul>
                </div>
                <div>
                    <strong style="color: var(--error); display: block; margin-bottom: 4px;">Growth Areas:</strong>
                    <ul style="margin: 0; padding: 0;">${weaknessesHtml || '<span style="color: var(--muted);">None identified.</span>'}</ul>
                </div>
            </div>
        `;
  } catch (err) {
    console.warn("AI insights load error:", err);
    const data = generateFallbackInsights(rec);

    const strengthsHtml = (data.strengths || []).map(s =>
      `<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">${window.escapeHtml(s)}</li>`
    ).join("");

    const weaknessesHtml = (data.weaknesses || []).map(w =>
      `<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">${window.escapeHtml(w)}</li>`
    ).join("");

    element.innerHTML = `
            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text);">
                <p style="margin: 0 0 12px 0; color: var(--muted); font-style: italic;">${window.escapeHtml(data.explanation)}</p>
                <div style="margin-bottom: 10px;">
                    <strong style="color: var(--success); display: block; margin-bottom: 4px;">Strengths:</strong>
                    <ul style="margin: 0; padding: 0;">${strengthsHtml}</ul>
                </div>
                <div>
                    <strong style="color: var(--error); display: block; margin-bottom: 4px;">Growth Areas:</strong>
                    <ul style="margin: 0; padding: 0;">${weaknessesHtml}</ul>
                </div>
            </div>
        `;
  }
}

function generateFallbackInsights(rec) {
  const matchedStr = rec.matched_skills.length > 0
    ? `You possess strong competency in core requirements: ${rec.matched_skills.join(", ")}.`
    : "No matched skills matched with this job opening.";

  const missingStr = rec.missing_skills.length > 0
    ? `Focus on building skills in missing areas: ${rec.missing_skills.join(", ")}.`
    : "You fully cover all requirements listed for this job.";

  return {
    explanation: `This role is a ${Math.round(rec.match_percentage)}% match based on your current profile containing ${rec.matched_skills.length} matching skills and ${rec.missing_skills.length} missing skill gaps.`,
    strengths: [matchedStr],
    weaknesses: [missingStr]
  };
}


