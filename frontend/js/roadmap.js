document.addEventListener("DOMContentLoaded", () => {
    checkDbHealth(document.getElementById("db-status"));

    window.addEventListener("userSelectionChanged", (e) => {
        const userId = e.detail.userId;
        if (userId) {
            loadRoadmap(userId);
        } else {
            clearRoadmap();
        }
    });

    const currentUserId = localStorage.getItem("selectedUserId");
    if (currentUserId) {
        loadRoadmap(currentUserId);
    } else {
        clearRoadmap();
    }
});

function clearRoadmap() {
    document.getElementById("roadmap-loading").style.display = "none";
    document.getElementById("roadmap-empty").style.display = "block";
    document.getElementById("roadmap-items").innerHTML = "";
    updateProgress(0, 0);
}

async function loadRoadmap(userId) {
    const loading = document.getElementById("roadmap-loading");
    const empty = document.getElementById("roadmap-empty");
    const container = document.getElementById("roadmap-items");

    loading.style.display = "block";
    empty.style.display = "none";
    container.innerHTML = "";
    updateProgress(0, 0);

    try {
        const userRes = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (userRes.ok) {
            const user = await userRes.json();
            const activeNameEl = document.getElementById("active-profile-name");
            if (activeNameEl) {
                activeNameEl.textContent = `Roadmap for ${escapeHtml(user.name)}`;
            }
        }

        const recsRes = await fetch(`${API_BASE_URL}/recommendations/${userId}?limit=1`);
        if (!recsRes.ok) throw new Error("Failed to fetch recommendations");
        const recsData = await recsRes.json();

        if (!recsData.recommendations || recsData.recommendations.length === 0) {
            loading.style.display = "none";
            empty.textContent = "We couldn't find any job recommendations to build a roadmap from. Try adjusting your skills.";
            empty.style.display = "block";
            return;
        }

        const topJobId = recsData.recommendations[0].job_id;

        const learnRes = await fetch(`${API_BASE_URL}/learning-recommendations/${userId}/${topJobId}`);
        if (!learnRes.ok) throw new Error("Failed to fetch learning recommendations");
        const learnData = await learnRes.json();

        const recommendations = learnData.recommendations || [];

        loading.style.display = "none";

        if (recommendations.length === 0) {
            empty.textContent = "Great news! You have no critical missing skills for your top targeted job.";
            empty.style.display = "block";
            return;
        }

        renderRoadmapItems(userId, recommendations);

    } catch (err) {
        console.error(err);
        loading.style.display = "none";
        empty.textContent = "An error occurred while building the roadmap.";
        empty.style.display = "block";
    }
}

function getProgressKey(userId) {
    return `roadmap_progress_${userId}`;
}

function getSavedProgress(userId) {
    try {
        const data = localStorage.getItem(getProgressKey(userId));
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveProgress(userId, progressState) {
    localStorage.setItem(getProgressKey(userId), JSON.stringify(progressState));
}

function renderRoadmapItems(userId, recommendations) {
    const container = document.getElementById("roadmap-items");
    const progressState = getSavedProgress(userId);

    let completedCount = 0;

    recommendations.forEach((rec, index) => {
        const isCompleted = !!progressState[rec.skill_name];
        if (isCompleted) completedCount++;

        const stepDiv = document.createElement("div");
        stepDiv.className = `roadmap-step ${isCompleted ? 'completed' : ''}`;
        stepDiv.style.border = "1px solid var(--border)";
        stepDiv.style.borderRadius = "8px";
        stepDiv.style.padding = "20px";
        stepDiv.style.marginBottom = "24px";
        stepDiv.style.background = "var(--surface)";

        // Format 01, 02..
        const stepNum = (index + 1).toString().padStart(2, '0');
        const indicator = isCompleted ? '●' : '○';

        stepDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
               <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">
                  <span style="color: var(--muted); margin-right: 12px;">${stepNum}</span>${escapeHtml(rec.skill_name)}
               </h3>
               <span class="status-indicator" style="font-size: 1.5rem; color: ${isCompleted ? 'var(--success)' : 'var(--muted)'};">${indicator}</span>
            </div>
            <p style="margin:0 0 16px 0; font-size: 0.95rem; color: var(--muted);">Priority: <span style="font-weight: 500; color: ${rec.importance === 'required' ? 'var(--error)' : 'var(--accent)'};">${rec.importance === 'required' ? 'High' : 'Medium'}</span></p>
            
            <h4 style="margin: 0 0 8px 0; font-size: 0.95rem;">Resources</h4>
            <ul class="resources-list" style="list-style-type: none; padding: 0; margin-bottom: 24px;">
                ${rec.resources.map(res => `
                    <li style="margin-bottom: 8px;"><a href="${escapeHtml(res.url)}" target="_blank" style="color: var(--accent); text-decoration: none;">[ ${escapeHtml(res.title)} ]</a></li>
                `).join('')}
            </ul>
        `;

        const actionBtn = document.createElement("button");
        actionBtn.style.marginTop = "0";
        actionBtn.style.width = "auto";
        if (isCompleted) {
            actionBtn.textContent = "Completed";
            actionBtn.style.background = "rgba(52, 199, 123, 0.2)";
            actionBtn.style.color = "var(--success)";
            actionBtn.style.boxShadow = "none";
        } else {
            actionBtn.textContent = "Mark as Complete";
        }

        actionBtn.addEventListener("click", () => {
            const currentlyCompleted = progressState[rec.skill_name];

            if (currentlyCompleted) {
                progressState[rec.skill_name] = false;
                completedCount--;
            } else {
                progressState[rec.skill_name] = true;
                completedCount++;
            }

            saveProgress(userId, progressState);

            // Re-render to update UI completely natively
            container.innerHTML = "";
            renderRoadmapItems(userId, recommendations);

            // Dispatch event so Dashboard KPI can update organically
            window.dispatchEvent(new CustomEvent("roadmapProgressChanged", { detail: { userId } }));
        });

        stepDiv.appendChild(actionBtn);
        container.appendChild(stepDiv);
    });

    updateProgress(completedCount, recommendations.length);
}

function updateProgress(completedCount, totalCount) {
    const textEl = document.getElementById("progress-text");
    const fillEl = document.getElementById("progress-bar-fill");

    if (totalCount === 0) {
        textEl.textContent = `No learning steps required.`;
        fillEl.style.width = `0%`;
        return;
    }

    const percentage = Math.round((completedCount / totalCount) * 100);
    textEl.textContent = `${completedCount} of ${totalCount} skills learned (${percentage}%)`;
    fillEl.style.width = `${percentage}%`;
}
