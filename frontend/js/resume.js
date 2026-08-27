// Resume uploading and parsing logic

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

const extractionResultEl = document.getElementById("extraction-result-section");
const extractedSkillsContainerEl = document.getElementById("extracted-skills-container");
const applySkillsBtn = document.getElementById("apply-skills-btn");
const applyStatusEl = document.getElementById("apply-status");

let currentUserId = null;
let extractedSkills = [];

// Listen for global user selection
window.addEventListener("userSelectionChanged", (e) => {
    currentUserId = e.detail.userId;
    if (!currentUserId) {
        showNoProfile();
    } else {
        showResumeContent();
    }
});

function showNoProfile() {
    noProfileAlertEl.style.display = "block";
    resumeContentEl.style.display = "none";
}

function showResumeContent() {
    noProfileAlertEl.style.display = "none";
    resumeContentEl.style.display = "block";
    resetResumeState();
}

function resetResumeState() {
    resumeFileEl.value = "";
    fileInfoEl.style.display = "none";
    fileNameEl.textContent = "";
    parseLoaderEl.style.display = "none";
    uploadErrMsgEl.style.display = "none";
    extractionResultEl.style.display = "none";
    extractedSkillsContainerEl.innerHTML = "";
    applyStatusEl.style.display = "none";
    applyStatusEl.className = "status-msg";
}

// Drag and drop event listeners
dropZoneEl.addEventListener("click", () => resumeFileEl.click());

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
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            resumeFileEl.files = e.dataTransfer.files;
            handleFileSelected(file);
        } else {
            showError("Please upload a PDF file only.");
        }
    }
});

resumeFileEl.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
    }
});

function handleFileSelected(file) {
    fileNameEl.textContent = file.name;
    fileInfoEl.style.display = "block";
    uploadErrMsgEl.style.display = "none";
}

function showError(msg) {
    uploadErrMsgEl.textContent = msg;
    uploadErrMsgEl.style.display = "block";
    parseLoaderEl.style.display = "none";
}

// Form Submission to extract resume skills
resumeFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (resumeFileEl.files.length === 0) {
        showError("Please pick a file first.");
        return;
    }

    const file = resumeFileEl.files[0];
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        showError("Please upload PDF resume only.");
        return;
    }

    // Pre-loading states
    uploadErrMsgEl.style.display = "none";
    extractionResultEl.style.display = "none";
    applyStatusEl.style.display = "none";
    parseLoaderEl.style.display = "block";
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Extracting...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/resume`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Resume parsing failed.");
        }

        extractedSkills = data.extracted_skills || [];
        renderExtractedSkills();
    } catch (err) {
        console.error("Resume upload error:", err);
        showError("Could not extract skills: " + err.message);
    } finally {
        parseLoaderEl.style.display = "none";
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Extract Skills";
    }
});

function renderExtractedSkills() {
    extractedSkillsContainerEl.innerHTML = "";
    if (extractedSkills.length === 0) {
        extractedSkillsContainerEl.innerHTML = '<span style="color: var(--muted); font-size: 0.9rem;">No tech skills matching our catalog could be extracted from your resume.</span>';
        applySkillsBtn.style.display = "none";
    } else {
        extractedSkills.forEach(skill => {
            const span = document.createElement("span");
            span.className = "pill pill-matched"; // styled green
            span.textContent = skill;
            extractedSkillsContainerEl.appendChild(span);
        });
        applySkillsBtn.style.display = "block";
    }
    extractionResultEl.style.display = "block";
}

// Copy extracted skills to profile DB handler
applySkillsBtn.addEventListener("click", async () => {
    if (!currentUserId || extractedSkills.length === 0) return;

    applySkillsBtn.disabled = true;
    applySkillsBtn.textContent = "Applying...";
    applyStatusEl.style.display = "none";

    try {
        const res = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/resume/apply-skills`, {
            method: "POST"
        });

        const data = await res.json();

        if (res.ok) {
            applyStatusEl.style.display = "block";
            applyStatusEl.className = "status-msg ok";

            const added = data.added_skills || [];
            const skipped = data.skipped_existing || [];
            applyStatusEl.innerHTML = `<strong>Skills applied!</strong><br>Added new skills: ${added.length > 0 ? window.escapeHtml(added.join(", ")) : "None"}<br>Skipped (were already in profile): ${skipped.length}`;

            // Reset file chooser
            resumeFileEl.value = "";
            fileInfoEl.style.display = "none";
            fileNameEl.textContent = "";
        } else {
            applyStatusEl.style.display = "block";
            applyStatusEl.className = "status-msg error-msg";
            applyStatusEl.textContent = "Failed to apply skills: " + (data.detail || "Server error.");
        }
    } catch (err) {
        console.error("Apply skills error:", err);
        applyStatusEl.style.display = "block";
        applyStatusEl.className = "status-msg error-msg";
        applyStatusEl.textContent = "Error: " + err.message;
    } finally {
        applySkillsBtn.disabled = false;
        applySkillsBtn.textContent = "Add these skills to my profile";
    }
});
