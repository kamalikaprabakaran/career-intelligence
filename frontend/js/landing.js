// Landing / Onboarding page logic

const dbStatusEl = document.getElementById("db-status");
const selectorCardEl = document.getElementById("selector-card");
const registerCardEl = document.getElementById("register-card");

const showRegisterLink = document.getElementById("show-register-link");
const showSelectLink = document.getElementById("show-select-link");

const startBtn = document.getElementById("start-btn");
const userSelectEl = document.getElementById("user-select");

const userFormEl = document.getElementById("user-form");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");

// Toggle navigation between Register and Selection
showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    selectorCardEl.style.display = "none";
    registerCardEl.style.display = "block";
    resultEl.style.display = "none";
});

showSelectLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerCardEl.style.display = "none";
    selectorCardEl.style.display = "block";
    loadLandingUsers();
});

// Load profiles for selector card
async function loadLandingUsers() {
    userSelectEl.innerHTML = '<option value="" disabled selected>Loading profiles...</option>';
    try {
        const res = await fetch(`${window.API_BASE_URL}/users`);
        if (!res.ok) throw new Error("Could not fetch user profiles");
        const users = await res.json();

        userSelectEl.innerHTML = '';
        if (users.length === 0) {
            userSelectEl.innerHTML = '<option value="" disabled selected>No existing profiles yet.</option>';
            // Auto toggle to register if no users exist
            selectorCardEl.style.display = "none";
            registerCardEl.style.display = "block";
            return;
        }

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a profile to continue...";
        defaultOption.selected = true;
        defaultOption.disabled = true;
        userSelectEl.appendChild(defaultOption);

        users.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = `${u.name} (${u.target_role || 'No Role'})`;
            userSelectEl.appendChild(opt);
        });

    } catch (err) {
        console.error("Landing dropdown list load failed:", err);
        userSelectEl.innerHTML = '<option value="" disabled>Error loading profiles</option>';
    }
}

// Redirects matching user
startBtn.addEventListener("click", () => {
    const userId = userSelectEl.value;
    if (!userId) {
        alert("Please select a profile to continue.");
        return;
    }
    localStorage.setItem("selectedUserId", userId);
    window.location.href = "dashboard.html";
});

// Create profile form submission
userFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Profile...";
    resultEl.style.display = "none";

    const payload = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        target_role: document.getElementById("target_role").value.trim() || null,
        education: document.getElementById("education").value.trim() || null,
        experience: document.getElementById("experience").value.trim() || null,
    };

    try {
        const res = await fetch(`${window.API_BASE_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
            resultEl.className = "status-msg ok";
            resultEl.textContent = `Profile created for ${data.name}! Redirecting to dashboard...`;
            resultEl.style.display = "block";

            // Save user ID, and redirect to dashboard
            localStorage.setItem("selectedUserId", data.id);

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);

        } else {
            resultEl.className = "status-msg error-msg";
            resultEl.textContent = "Failed to create profile: " + (data.detail || JSON.stringify(data));
            resultEl.style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "Create & Get Started";
        }
    } catch (err) {
        console.error(err);
        resultEl.className = "status-msg error-msg";
        resultEl.textContent = "Request fail: " + err.message;
        resultEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Create & Get Started";
    }
});

// Init landing
async function initLanding() {
    if (window.checkDbHealth) {
        await window.checkDbHealth(dbStatusEl);
    }

    // Pre-load list in background to see if we navigate immediately
    try {
        const res = await fetch(`${window.API_BASE_URL}/users`);
        if (res.ok) {
            const users = await res.json();
            if (users.length > 0) {
                // If users exist, open with selection page
                registerCardEl.style.display = "none";
                selectorCardEl.style.display = "block";
                loadLandingUsers();
            } else {
                // Otherwise, open register page
                selectorCardEl.style.display = "none";
                registerCardEl.style.display = "block";
            }
        }
    } catch (err) {
        console.error("Failed pre-load check:", err);
    }
}

initLanding();
