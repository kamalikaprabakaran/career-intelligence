/**
 * resume.js — powers resume.html
 *
 * Fixes applied (2026-09-08):
 *  1. Populate #user-select from GET /users and honor localStorage pre-selection.
 *  2. Wire #user-select change → set currentUserId → show/hide content.
 *  3. Null-guard any profile.html-only element refs so this file is safe on
 *     resume.html (where those elements simply don't exist).
 *  4. Button is type="submit" — form has onsubmit=preventDefault in HTML, but
 *     the click handler also calls e.preventDefault() for belt-and-suspenders.
 */

// ─── Element refs (all exist on resume.html) ──────────────────────────────────
const userSelectEl = document.getElementById("user-select");
const noProfileAlertEl = document.getElementById("no-profile-alert");
const resumeContentEl = document.getElementById("resume-content");

const dropZoneEl = document.getElementById("drop-zone");
const resumeFileEl = document.getElementById("resume-file");
const fileInfoEl = document.getElementById("file-info");
const fileNameEl = document.getElementById("file-name");
const resumeFormEl = document.getElementById("resume-form");
const uploadBtn = document.getElementById("upload-btn");

const parseLoaderEl = document.getElementById("parse-loader");
const uploadErrMsgEl = document.getElementById("upload-err-msg");

const extractionResultSection = document.getElementById("extraction-result-section");
const extractedSkillsContainer = document.getElementById("extracted-skills-container");
const applySkillsBtn = document.getElementById("apply-skills-btn");
const applyStatusEl = document.getElementById("apply-status");

// ─── State ────────────────────────────────────────────────────────────────────
let currentUserId = null;
let extractedSkills = [];   // skills returned by the last successful upload

// ─── Utilities ────────────────────────────────────────────────────────────────
function showError(msg) {
    if (!uploadErrMsgEl) return;
    uploadErrMsgEl.textContent = msg;
    uploadErrMsgEl.style.display = "block";
    if (parseLoaderEl) parseLoaderEl.style.display = "none";
}

function hideError() {
    if (uploadErrMsgEl) uploadErrMsgEl.style.display = "none";
}

function showNoProfile() {
    if (noProfileAlertEl) noProfileAlertEl.style.display = "block";
    if (resumeContentEl) resumeContentEl.style.display = "none";
}

function showResumeContent() {
    if (noProfileAlertEl) noProfileAlertEl.style.display = "none";
    if (resumeContentEl) resumeContentEl.style.display = "block";
    resetUploadState();
}

function resetUploadState() {
    if (resumeFileEl) resumeFileEl.value = "";
    if (fileInfoEl) fileInfoEl.style.display = "none";
    if (fileNameEl) fileNameEl.textContent = "";
    if (parseLoaderEl) parseLoaderEl.style.display = "none";
    if (uploadErrMsgEl) uploadErrMsgEl.style.display = "none";
    if (extractionResultSection) extractionResultSection.style.display = "none";
    if (extractedSkillsContainer) extractedSkillsContainer.innerHTML = "";
    if (applyStatusEl) applyStatusEl.style.display = "none";
    extractedSkills = [];
}

// ─── Populate user dropdown ───────────────────────────────────────────────────
async function populateUserSelect() {
    if (!userSelectEl) return;

    try {
        const res = await fetch(`${window.API_BASE_URL}/users`);
        if (!res.ok) throw new Error("Failed to load users");
        const users = await res.json();

        // Clear placeholder option
        userSelectEl.innerHTML = "";

        if (users.length === 0) {
            userSelectEl.innerHTML =
                '<option value="" disabled selected>No profiles found — create one on the home page</option>';
            showNoProfile();
            return;
        }

        // Blank "please choose" option
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.textContent = "— Select a profile —";
        userSelectEl.appendChild(placeholder);

        const savedId = localStorage.getItem("selectedUserId");
        let matched = false;

        users.forEach(user => {
            const opt = document.createElement("option");
            opt.value = user.id;
            opt.textContent = user.name || user.email || user.id;
            if (user.id === savedId) {
                opt.selected = true;
                matched = true;
            }
            userSelectEl.appendChild(opt);
        });

        if (matched && savedId) {
            // Pre-select the saved profile automatically
            currentUserId = savedId;
            showResumeContent();
        } else {
            placeholder.selected = true;
            showNoProfile();
        }
    } catch (err) {
        console.error("populateUserSelect error:", err);
        if (userSelectEl) {
            userSelectEl.innerHTML =
                '<option value="" disabled selected>Error loading profiles</option>';
        }
        showNoProfile();
    }
}

// Wire the dropdown change event so choosing a profile shows the upload section
if (userSelectEl) {
    userSelectEl.addEventListener("change", () => {
        const selected = userSelectEl.value;
        if (selected) {
            currentUserId = selected;
            localStorage.setItem("selectedUserId", selected);
            showResumeContent();
        } else {
            currentUserId = null;
            showNoProfile();
        }
    });
}

// Also keep listening for the global userSelectionChanged event so the page
// stays in sync when navigation.js fires it (e.g. on DOMContentLoaded).
window.addEventListener("userSelectionChanged", (e) => {
    const uid = e.detail?.userId || null;
    if (uid) {
        currentUserId = uid;
        // Reflect in the dropdown if it's there
        if (userSelectEl) {
            for (const opt of userSelectEl.options) {
                if (opt.value === uid) { opt.selected = true; break; }
            }
        }
        showResumeContent();
    } else {
        currentUserId = null;
        showNoProfile();
    }
});

// ─── Drag-and-drop ────────────────────────────────────────────────────────────
if (dropZoneEl) {
    dropZoneEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZoneEl.classList.add("dragover");
    });
    dropZoneEl.addEventListener("dragleave", () => {
        dropZoneEl.classList.remove("dragover");
    });
    dropZoneEl.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZoneEl.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
                resumeFileEl.files = e.dataTransfer.files;
                handleFileSelected(file);
            } else {
                showError("Please upload a PDF file only.");
            }
        }
    });
}

if (resumeFileEl) {
    resumeFileEl.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleFileSelected(e.target.files[0]);
    });
}

function handleFileSelected(file) {
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileInfoEl) fileInfoEl.style.display = "block";
    hideError();
}

// ─── Upload handler ───────────────────────────────────────────────────────────
if (uploadBtn) {
    uploadBtn.addEventListener("click", async (e) => {
        e.preventDefault();  // belt-and-suspenders (form also has onsubmit=preventDefault)

        // Must have a profile selected
        if (!currentUserId) {
            showError("Please select a profile first.");
            return;
        }

        // Must have a file
        if (!resumeFileEl || resumeFileEl.files.length === 0) {
            showError("Please select a PDF resume first.");
            return;
        }

        const file = resumeFileEl.files[0];

        // PDF-only validation
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            showError("Please upload a PDF file only.");
            return;
        }

        // ── UI: loading state ──
        hideError();
        if (parseLoaderEl) parseLoaderEl.style.display = "block";
        if (extractionResultSection) extractionResultSection.style.display = "none";
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Extracting skills…";

        console.log("[resume.js] Uploading:", file.name, file.size, "bytes → /users/" + currentUserId + "/resume");

        const formData = new FormData();
        formData.append("file", file);   // key must match FastAPI param name "file"

        try {
            const res = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/resume`, {
                method: "POST",
                body: formData
                // NOTE: Do NOT set Content-Type manually — the browser sets the
                //       multipart/form-data boundary automatically.
            });

            const data = await res.json();
            console.log("[resume.js] Upload response:", res.status, data);

            if (!res.ok) {
                throw new Error(data.detail || `Server error ${res.status}`);
            }

            extractedSkills = data.extracted_skills || [];

            if (extractedSkills.length === 0) {
                showError("No recognisable tech skills found in your resume. Try a PDF with selectable text.");
                return;
            }

            // ── Display extracted skills as pills ──
            if (extractedSkillsContainer) {
                extractedSkillsContainer.innerHTML = "";
                extractedSkills.forEach(skill => {
                    const pill = document.createElement("span");
                    pill.className = "skill-tag";
                    pill.style.cssText =
                        "display:inline-block;padding:4px 12px;border-radius:20px;" +
                        "background:rgba(79,140,255,0.15);border:1px solid rgba(79,140,255,0.35);" +
                        "color:var(--accent,#4f8cff);font-size:0.85rem;font-weight:500;";
                    pill.textContent = skill;
                    extractedSkillsContainer.appendChild(pill);
                });
            }
            if (extractionResultSection) extractionResultSection.style.display = "block";

        } catch (err) {
            console.error("[resume.js] Upload error:", err);
            showError("Upload failed: " + err.message);
        } finally {
            if (parseLoaderEl) parseLoaderEl.style.display = "none";
            uploadBtn.disabled = false;
            uploadBtn.textContent = "Extract Skills";
        }
    });
}

// ─── Apply skills to profile ──────────────────────────────────────────────────
if (applySkillsBtn) {
    applySkillsBtn.addEventListener("click", async () => {
        if (!currentUserId || extractedSkills.length === 0) return;

        applySkillsBtn.disabled = true;
        applySkillsBtn.textContent = "Applying…";
        if (applyStatusEl) applyStatusEl.style.display = "none";

        try {
            const res = await fetch(
                `${window.API_BASE_URL}/users/${currentUserId}/resume/apply-skills`,
                { method: "POST" }
            );
            const data = await res.json();
            console.log("[resume.js] apply-skills response:", res.status, data);

            if (res.ok) {
                const added = data.added_skills?.length ?? 0;
                const skipped = data.skipped_existing ?? 0;

                if (applyStatusEl) {
                    applyStatusEl.className = "status-msg";
                    applyStatusEl.style.cssText =
                        "display:block;margin-top:12px;border-radius:6px;" +
                        "padding:12px 16px;background:rgba(52,199,123,0.1);" +
                        "border:1px solid rgba(52,199,123,0.3);color:#34c77b;font-size:0.9rem;";
                    applyStatusEl.textContent =
                        `✓ ${added} skill${added !== 1 ? "s" : ""} added to your profile` +
                        (skipped > 0 ? ` (${skipped} already existed, skipped)` : "") + ".";
                }

                // Dispatch so profile.js reloads the My Skills list if open in another tab
                window.dispatchEvent(new CustomEvent("skillsUpdated"));

                applySkillsBtn.textContent = "✓ Skills applied!";
            } else {
                throw new Error(data.detail || "Server error");
            }
        } catch (err) {
            console.error("[resume.js] apply-skills error:", err);
            if (applyStatusEl) {
                applyStatusEl.style.cssText =
                    "display:block;margin-top:12px;border-radius:6px;" +
                    "padding:12px 16px;background:rgba(255,80,80,0.1);" +
                    "border:1px solid rgba(255,80,80,0.3);color:#ff5050;font-size:0.9rem;";
                applyStatusEl.textContent = "Failed to apply skills: " + err.message;
            }
            applySkillsBtn.disabled = false;
            applySkillsBtn.textContent = "Add these skills to my profile";
        }
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Populate the dropdown as soon as the script runs.
// navigation.js fires DOMContentLoaded first (scripts are in order), so by the
// time we reach here the navbar is already rendered and the userSelectionChanged
// event will fire ~50 ms later — populateUserSelect runs concurrently and will
// pre-select the right option on its own.
populateUserSelect();
