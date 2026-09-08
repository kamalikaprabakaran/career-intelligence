const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('resumeFileInput');
const uploadBtn = document.getElementById('uploadBtn');
const extractedSkillsDisplay = document.getElementById('extractedSkillsDisplay');
const applySkillsBtn = document.getElementById('applySkillsBtn');
const uploadStatus = document.getElementById('uploadStatus');

const noProfileAlertEl = document.getElementById('no-profile-alert');
const resumeContentEl = document.getElementById('resume-content');

let selectedFile = null;
let currentUserId = null;

// Listen for global user change from navigation.js
window.addEventListener("userSelectionChanged", (e) => {
    currentUserId = e.detail.userId;
    if (!currentUserId) {
        if (noProfileAlertEl) noProfileAlertEl.style.display = "block";
        if (resumeContentEl) resumeContentEl.style.display = "none";
    } else {
        if (noProfileAlertEl) noProfileAlertEl.style.display = "none";
        if (resumeContentEl) resumeContentEl.style.display = "block";
    }
});

// Clicking anywhere in the drop zone triggers the real file input
dropZone.addEventListener('click', () => fileInput.click());

// Drag-and-drop support
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
    }
});

// Normal file picker selection
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
    }
});

function handleFileSelected(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        uploadStatus.textContent = 'Please select a PDF file.';
        uploadStatus.className = 'status-msg error-msg';
        uploadStatus.style.color = 'var(--error)';
        return;
    }
    selectedFile = file;
    document.getElementById('selectedFileName').textContent = `Selected: ${file.name}`;

    // reset state
    uploadStatus.textContent = '';
    uploadStatus.style.color = 'var(--text)';
    extractedSkillsDisplay.innerHTML = '';
    applySkillsBtn.style.display = 'none';

    uploadBtn.disabled = false;
}

uploadBtn.addEventListener('click', async () => {
    if (!selectedFile || !currentUserId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    uploadStatus.textContent = '';
    uploadStatus.className = 'status-msg';
    uploadStatus.style.color = 'var(--text)';
    extractedSkillsDisplay.innerHTML = '';
    applySkillsBtn.style.display = 'none';

    try {
        const response = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/resume`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Upload failed');

        uploadStatus.textContent = 'Upload successful!';
        uploadStatus.style.color = 'var(--success)';

        // render data.extracted_skills as tags in #extractedSkillsDisplay
        const skills = data.extracted_skills || [];

        if (skills.length === 0) {
            uploadStatus.textContent = 'Upload successful, but no tech skills were found in the text.';
            uploadStatus.style.color = 'var(--muted)';
        } else {
            skills.forEach(skill => {
                const pill = document.createElement("span");
                pill.className = "skill-tag";
                pill.style.cssText = "display:inline-block;padding:4px 12px;border-radius:20px;background:rgba(79,140,255,0.15);border:1px solid rgba(79,140,255,0.35);color:var(--accent);font-size:0.85rem;font-weight:500;";
                pill.textContent = skill;
                extractedSkillsDisplay.appendChild(pill);
            });

            // then show a button to call POST /users/{userId}/resume/apply-skills
            applySkillsBtn.style.display = 'block';
        }
    } catch (error) {
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.className = 'status-msg error-msg';
        uploadStatus.style.color = 'var(--error)';
        console.error('Resume upload failed:', error);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Extract Skills from Resume';
    }
});

applySkillsBtn.addEventListener('click', async () => {
    if (!currentUserId) return;

    applySkillsBtn.disabled = true;
    applySkillsBtn.textContent = 'Applying...';
    uploadStatus.textContent = '';

    try {
        const response = await fetch(`${window.API_BASE_URL}/users/${currentUserId}/resume/apply-skills`, {
            method: 'POST'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to apply skills');

        const added = data.added_skills?.length || 0;
        const skipped = data.skipped_existing || 0;

        uploadStatus.textContent = `Success! Added ${added} new skill(s) to your profile (${skipped} existing skills skipped).`;
        uploadStatus.style.color = 'var(--success)';

        applySkillsBtn.style.display = 'none';

    } catch (err) {
        uploadStatus.textContent = `Error applying skills: ${err.message}`;
        uploadStatus.className = 'status-msg error-msg';
        uploadStatus.style.color = 'var(--error)';
        applySkillsBtn.disabled = false;
        applySkillsBtn.textContent = 'Try Again';
    }
});
