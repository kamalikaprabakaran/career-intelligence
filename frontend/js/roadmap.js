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
    // NOTE: Do NOT call loadRoadmap() directly here.
    // navigation.js fires userSelectionChanged with the stored userId (or null)
    // after a 50ms delay, which will trigger the listener above exactly once.
    // Calling loadRoadmap() here AND triggering via the event causes a double render.
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

        let serverRecs = [];
        try {
            const recsRes = await fetch(`${API_BASE_URL}/recommendations/${userId}?limit=1`);
            if (recsRes.ok) {
                const recsData = await recsRes.json();
                if (recsData.recommendations && recsData.recommendations.length > 0) {
                    const topJobId = recsData.recommendations[0].job_id;
                    const learnRes = await fetch(`${API_BASE_URL}/learning-recommendations/${userId}/${topJobId}`);
                    if (learnRes.ok) {
                        const learnData = await learnRes.json();
                        serverRecs = learnData.recommendations || [];
                    }
                }
            }
        } catch (e) {
            console.error("Could not fetch server recommendations:", e);
        }

        const customRecs = getCustomSkills(userId);
        const combined = [...serverRecs, ...customRecs];

        loading.style.display = "none";

        // Show form since they have a profile loaded
        const customForm = document.getElementById("custom-skill-form");
        if (customForm) customForm.style.display = "block";

        if (combined.length === 0) {
            empty.textContent = "No job recommendations or roadmap steps available. Add a custom skill to get started!";
            empty.style.display = "block";
            return;
        }

        renderRoadmapItems(userId, combined);

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
            <p style="margin:0 0 16px 0; font-size: 0.95rem; color: var(--muted);">${rec.is_custom ?
                `<span style="color: var(--accent); font-weight: 500;">Custom Learning Goal:</span> ${escapeHtml(rec.rationale || "Added manually to your sequence.")}` :
                `Priority: <span style="font-weight: 500; color: ${rec.importance === 'required' ? 'var(--error)' : 'var(--accent)'};">${rec.importance === 'required' ? 'High' : 'Medium'}</span>`}</p>
            
            <h4 style="margin: 0 0 8px 0; font-size: 0.95rem;">Resources</h4>
            <ul class="resources-list" style="list-style-type: none; padding: 0; margin-bottom: 24px;">
                ${(rec.resources || []).map(res => `
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

        if (rec.is_custom) {
            const removeBtn = document.createElement("button");
            removeBtn.style.marginTop = "0";
            removeBtn.style.marginLeft = "12px";
            removeBtn.style.width = "auto";
            removeBtn.textContent = "Remove";
            removeBtn.style.background = "rgba(255, 95, 109, 0.1)";
            removeBtn.style.color = "var(--error)";
            removeBtn.style.border = "1px solid rgba(255, 95, 109, 0.2)";
            removeBtn.style.boxShadow = "none";

            removeBtn.addEventListener("click", () => {
                removeCustomSkill(userId, rec.skill_name);
                // clean up completed status if existed
                if (progressState[rec.skill_name]) {
                    delete progressState[rec.skill_name];
                    saveProgress(userId, progressState);
                }
                loadRoadmap(userId);
            });
            stepDiv.appendChild(removeBtn);
        }

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

// Custom Skills logic
function getCustomSkills(userId) {
    try {
        return JSON.parse(localStorage.getItem(`roadmap_custom_skills_${userId}`)) || [];
    } catch {
        return [];
    }
}

function saveCustomSkills(userId, skills) {
    localStorage.setItem(`roadmap_custom_skills_${userId}`, JSON.stringify(skills));
}

function addCustomSkill(userId, skillName) {
    const skills = getCustomSkills(userId);
    if (!skills.some(s => (s.skill_name || "").toLowerCase() === (skillName || "").toLowerCase())) {
        skills.push({
            skill_name: skillName.trim(),
            is_custom: true,
            rationale: "Selected for personal roadmap expansion based on current market trends.",
            resources: getSimulatedResources(skillName)
        });
        saveCustomSkills(userId, skills);
    }
}

function removeCustomSkill(userId, skillName) {
    let skills = getCustomSkills(userId);
    skills = skills.filter(s => s.skill_name !== skillName);
    saveCustomSkills(userId, skills);
}

function getSimulatedResources(skillName) {
    const nameStr = (skillName || "").toLowerCase();
    if (nameStr.includes("aws") || nameStr.includes("cloud")) {
        return [{ title: "AWS Skill Builder Free Tier", url: "https://explore.skillbuilder.aws/" }];
    }
    if (nameStr.includes("docker") || nameStr.includes("kubernetes")) {
        return [{ title: "Docker 101 Tutorial", url: "https://www.docker.com/101-tutorial/" }];
    }
    if (nameStr.includes("react") || nameStr.includes("vue") || nameStr.includes("frontend")) {
        return [{ title: "Frontend Masters Free Courses", url: "https://frontendmasters.com/courses/" }];
    }
    if (nameStr.includes("python") || nameStr.includes("node") || nameStr.includes("java")) {
        return [{ title: "freeCodeCamp Backend API Challenges", url: "https://www.freecodecamp.org/" }];
    }
    return [{ title: `Learn ${skillName} on Coursera`, url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}` }];
}

// Attach listener to Add Custom Skill button
document.addEventListener("DOMContentLoaded", () => {
    const customInput = document.getElementById("custom-skill-input");
    const customSubmitBtn = document.getElementById("add-custom-skill-btn");
    const customError = document.getElementById("custom-skill-error");

    if (customSubmitBtn && customInput) {
        customSubmitBtn.addEventListener("click", () => {
            const val = customInput.value.trim();
            const currentUserId = localStorage.getItem("selectedUserId");
            if (!val) {
                customError.textContent = "Please enter a skill name.";
                customError.style.display = "block";
                return;
            }
            if (!currentUserId) {
                customError.textContent = "No user selected.";
                customError.style.display = "block";
                return;
            }

            customError.style.display = "none";
            addCustomSkill(currentUserId, val);
            customInput.value = "";
            loadRoadmap(currentUserId);
        });

        // Also allow submitting with Enter key
        customInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                customSubmitBtn.click();
            }
        });
    }
});
