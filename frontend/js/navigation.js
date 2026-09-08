const API_BASE_URL = "http://127.0.0.1:8001";

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

  const savedUserId = localStorage.getItem("selectedUserId");

  // Protected pages: redirect to login if no session
  const protectedPages = ["dashboard.html", "profile.html", "upload-resume.html", "recommendations.html", "roadmap.html", "jobs.html"];
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (!savedUserId && protectedPages.includes(currentPage)) {
    window.location.href = "index.html";
    return;
  }

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('userSelectionChanged', { detail: { userId: savedUserId || null } }));
  }, 50);
});

function renderNavbar() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  const sidebarHtml = `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-header" style="position: relative;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span class="sidebar-title">AI Career Intelligence</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button id="logout-btn" style="flex: 1; background: rgba(79, 140, 255, 0.1); border: 1px solid rgba(79, 140, 255, 0.2); color: var(--accent); cursor: pointer; font-size: 0.85rem; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s;" title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
          </button>
          <button class="mobile-menu-btn" id="mobile-menu-btn">&#10005;</button>
        </div>
      </div>
      <div class="sidebar-links" id="sidebar-links">
        <a href="dashboard.html" class="sidebar-link ${currentPath === 'dashboard.html' ? 'active' : ''}" id="nav-dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Dashboard
        </a>
        <a href="profile.html" class="sidebar-link ${currentPath === 'profile.html' ? 'active' : ''}" id="nav-profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          My Profile
        </a>
        <a href="upload-resume.html" class="sidebar-link ${currentPath === 'upload-resume.html' ? 'active' : ''}" id="nav-upload-resume">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Upload Resume
        </a>

        <a href="jobs.html" class="sidebar-link ${currentPath === 'jobs.html' ? 'active' : ''}" id="nav-jobs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          Jobs
        </a>
        <a href="recommendations.html" class="sidebar-link ${currentPath === 'recommendations.html' ? 'active' : ''}" id="nav-recommendations">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          Recommendations
        </a>
        <a href="roadmap.html" class="sidebar-link ${currentPath === 'roadmap.html' ? 'active' : ''}" id="nav-roadmap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
          Learning Roadmap
        </a>
      </div>
    </nav>
    <button class="mobile-menu-open-btn" id="mobile-menu-open-btn">&#9776;</button>
  `;

  // Inject at the top of the body
  document.body.insertAdjacentHTML("afterbegin", sidebarHtml);

  // Setup mobile menu toggle
  const closeBtn = document.getElementById("mobile-menu-btn");
  const openBtn = document.getElementById("mobile-menu-open-btn");
  const sidebar = document.getElementById("sidebar");

  if (openBtn && sidebar) {
    openBtn.addEventListener("click", () => {
      sidebar.classList.add("show");
    });
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("show");
    });
  }

  // Setup Logout toggle
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("selectedUserId");
      window.location.href = "index.html";
    });
  }
}

