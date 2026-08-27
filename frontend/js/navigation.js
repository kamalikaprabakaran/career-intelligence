const API_BASE_URL = "http://127.0.0.1:8000";

// Export variables on window object for easy global access
window.API_BASE_URL = API_BASE_URL;

// Escape user inputs safely
window.escapeHtml = function (str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Check DB Connection helper
window.checkDbHealth = async function (statusEl) {
    if (!statusEl) return;
    try {
        const res = await fetch(`${API_BASE_URL}/health/db`);
        const data = await res.json();
        if (data.status === "ok") {
            statusEl.innerHTML = `<span class="status-dot ok"></span>Database Connected`;
        } else {
            statusEl.innerHTML = `<span class="status-dot error"></span>FastAPI connected, Supabase issue`;
        }
    } catch (err) {
        statusEl.innerHTML = `<span class="status-dot error"></span>Connection Error`;
    }
};

// Auto-inject Navbar
document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    setupUserSelector();
});

function renderNavbar() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    const navbarHtml = `
    <nav class="navbar">
      <div class="navbar-container">
        <a href="index.html" class="navbar-brand">AI Career Intelligence</a>
        <div class="navbar-links">
          <a href="dashboard.html" class="navbar-link ${currentPath === 'dashboard.html' ? 'active' : ''}" id="nav-dashboard">Dashboard</a>
          <a href="profile.html" class="navbar-link ${currentPath === 'profile.html' ? 'active' : ''}" id="nav-profile">My Profile</a>
          <a href="resume.html" class="navbar-link ${currentPath === 'resume.html' ? 'active' : ''}" id="nav-resume">Upload Resume</a>
          <a href="jobs.html" class="navbar-link ${currentPath === 'jobs.html' ? 'active' : ''}" id="nav-jobs">Jobs</a>
          <a href="recommendations.html" class="navbar-link ${currentPath === 'recommendations.html' ? 'active' : ''}" id="nav-recommendations">Recommendations</a>
        </div>
      </div>
    </nav>
  `;

    // Inject at the top of the body
    document.body.insertAdjacentHTML("afterbegin", navbarHtml);
}

// Global user dropdown population and synchronization
async function setupUserSelector() {
    const userSelect = document.getElementById("user-select");
    if (!userSelect) return; // Not all pages might have user selector (e.g. index.html)

    // Populate loading status
    userSelect.innerHTML = '<option value="" disabled selected>Loading profiles...</option>';

    try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (!res.ok) throw new Error("Failed to load users");
        const users = await res.json();

        userSelect.innerHTML = '';
        if (users.length === 0) {
            userSelect.innerHTML = '<option value="" disabled selected>No users available</option>';
            // Trigger event if custom handler handles empty list
            window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId: null } }));
            return;
        }

        // Add default prompt
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a user profile...";
        defaultOption.disabled = false;
        defaultOption.selected = true;
        userSelect.appendChild(defaultOption);

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = `${user.name} (${user.target_role || 'No Role'} - ${user.email})`;
            userSelect.appendChild(option);
        });

        // Check if we have a user in localStorage
        const savedUserId = localStorage.getItem("selectedUserId");
        const userExists = users.some(u => u.id === savedUserId);

        if (savedUserId && userExists) {
            userSelect.value = savedUserId;
            // Trigger a custom event so page-specific JS knows the initial selection is ready
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId: savedUserId } }));
            }, 50);
        } else {
            userSelect.value = "";
            localStorage.removeItem("selectedUserId");
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId: null } }));
            }, 50);
        }

        // Listen to changes to save in localStorage and dispatch event
        userSelect.addEventListener("change", (e) => {
            const userId = e.target.value;
            if (userId) {
                localStorage.setItem("selectedUserId", userId);
                window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId } }));
            } else {
                localStorage.removeItem("selectedUserId");
                window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId: null } }));
            }
        });

    } catch (err) {
        console.error("Error user dropdown setup:", err);
        userSelect.innerHTML = '<option value="" disabled>Error loading profiles</option>';
    }
}
