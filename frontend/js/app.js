// Change this if your backend runs somewhere else (e.g. your Render URL later)
const API_BASE_URL = "http://127.0.0.1:8000";

const dbStatusEl = document.getElementById("db-status");
const formEl = document.getElementById("user-form");
const resultEl = document.getElementById("result");
const submitBtn = document.getElementById("submit-btn");

// Check FastAPI <-> Supabase connection on page load (Step 6 of the roadmap)
async function checkDbHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health/db`);
    const data = await res.json();

    if (data.status === "ok") {
      dbStatusEl.innerHTML = `<span class="status-dot ok"></span>Connected to Supabase`;
    } else {
      dbStatusEl.innerHTML = `<span class="status-dot error"></span>Backend up, Supabase not connected`;
    }
  } catch (err) {
    dbStatusEl.innerHTML = `<span class="status-dot error"></span>Backend not reachable at ${API_BASE_URL}`;
  }
}

// Step 7 of the roadmap: POST /users and confirm it appears in Supabase
formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    education: document.getElementById("education").value || null,
    target_role: document.getElementById("target_role").value || null,
    experience: document.getElementById("experience").value || null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      resultEl.className = "ok";
      resultEl.textContent = "User created:\n" + JSON.stringify(data, null, 2);
      formEl.reset();
    } else {
      resultEl.className = "error";
      resultEl.textContent = "Error:\n" + JSON.stringify(data, null, 2);
    }
  } catch (err) {
    resultEl.className = "error";
    resultEl.textContent = "Request failed: " + err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create User";
  }
});

checkDbHealth();