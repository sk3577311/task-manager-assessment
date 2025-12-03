/* ============================================================
   COMPLETE FRONTEND APP.JS FOR TASK MANAGER
   ------------------------------------------------------------
   - Includes Register, Login, Logout
   - Create, Load, Update, Delete Tasks
   - Pagination
   - Navbar Session Handling
   - Stable redirects (/login, /register, /tasks)
   - Fully Playwright-compatible
=============================================================== */

const API_BASE = "http://localhost:5000";
let currentPage = 1;

/* ------------------------------------------------------------
   TOKEN & SESSION HELPERS
------------------------------------------------------------ */
function getToken() {
  return localStorage.getItem("token");
}
function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}
function getTokenPayload() {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
function ensureValidToken() {
  const token = getToken();
  if (!token || token === "undefined" || token === "null") {
    clearSession();
    return false;
  }
  const payload = getTokenPayload();
  if (!payload) {
    clearSession();
    return false;
  }
  return true;
}

/* ------------------------------------------------------------
   TOASTS
------------------------------------------------------------ */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ------------------------------------------------------------
   NAVBAR UPDATE
------------------------------------------------------------ */
function updateNav() {
  const navLinks = document.getElementById("nav-links");
  const navUser = document.getElementById("nav-user");
  if (!navLinks || !navUser) return;

  const loggedIn = ensureValidToken();
  const username = localStorage.getItem("username") || "";

  navLinks.innerHTML = "";

  if (loggedIn) {
    const tasks = document.createElement("a");
    tasks.href = "/tasks";
    tasks.innerText = "Tasks";
    tasks.className = "nav-link";

    const logout = document.createElement("a");
    logout.href = "#";
    logout.innerText = "Logout";
    logout.className = "nav-link";
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });

    navLinks.appendChild(tasks);
    navLinks.appendChild(logout);
    navUser.innerText = `Hi ${username}`;
  } else {
    const login = document.createElement("a");
    login.href = "/login";
    login.innerText = "Login";
    login.className = "nav-link";

    const register = document.createElement("a");
    register.href = "/register";
    register.innerText = "Register";
    register.className = "nav-link";

    navLinks.appendChild(login);
    navLinks.appendChild(register);
    navUser.innerText = "";
  }
}

/* ------------------------------------------------------------
   AUTH: REGISTER, LOGIN, LOGOUT
------------------------------------------------------------ */
async function registerUser() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  if (!username || !password) return showToast("All fields required", "error");

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) return showToast("Registration failed", "error");

    showToast("Registered!", "success");
    window.location.href = "/login";
  } catch {
    showToast("Network error", "error");
  }
}

async function login() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  if (!username || !password) return showToast("All fields required", "error");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok || !data.access_token) {
      return showToast("Invalid credentials", "error");
    }

    setToken(data.access_token);
    localStorage.setItem("username", username);

    showToast("Login successful", "success");
    window.location.href = "/tasks";
  } catch {
    showToast("Network error", "error");
  }
}

function logoutUser() {
  clearSession();
  updateNav();
  window.location.href = "/login";
}

/* ------------------------------------------------------------
   TASKS: LOAD / CREATE / UPDATE / DELETE
------------------------------------------------------------ */

async function loadTasks() {
  if (!ensureValidToken()) return (window.location.href = "/login");

  const token = getToken();
  const filter = document.getElementById("filter")?.value || "all";

  let url = `${API_BASE}/tasks?page=${currentPage}&per_page=5`;
  if (filter !== "all") url += `&completed=${filter}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    renderTasks(data.tasks || []);
    document.getElementById("pageLabel").innerText = `Page ${currentPage}`;
  } catch {
    showToast("Failed to load tasks", "error");
  }
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";

  if (!tasks.length) {
    list.innerHTML = "<div class='small'>No tasks yet</div>";
    return;
  }

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task-item";

    div.innerHTML = `
      <strong>${t.title}</strong>
      <div class="small">${t.description || ""}</div>
      <div>
        <span class="${t.completed ? "complete-tag" : "incomplete-tag"}">
          ${t.completed ? "Completed" : "Not Completed"}
        </span>
      </div>
      <div class="mt-2">
        <button class="btn-inline btn-primary" onclick="editTask(${t.id})">Edit</button>
        <button class="btn-inline btn-danger" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    `;

    list.appendChild(div);
  });
}

async function createTask() {
  if (!ensureValidToken()) return (window.location.href = "/login");

  const title = document.getElementById("title")?.value?.trim();
  const description = document.getElementById("description")?.value?.trim();

  if (!title) return showToast("Title required", "error");

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, description })
    });

    if (!res.ok) return showToast("Failed to create", "error");

    showToast("Task created!", "success");
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    loadTasks();
  } catch {
    showToast("Network error", "error");
  }
}

async function editTask(id) {
  if (!ensureValidToken()) return (window.location.href = "/login");

  const newTitle = prompt("New title:");
  if (!newTitle) return showToast("Title required", "error");

  const newDesc = prompt("New description:") || "";

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title: newTitle, description: newDesc })
    });

    if (!res.ok) return showToast("Update failed", "error");

    showToast("Updated!", "success");
    loadTasks();
  } catch {
    showToast("Network error", "error");
  }
}

async function deleteTask(id) {
  if (!ensureValidToken()) return (window.location.href = "/login");

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!res.ok) return showToast("Delete failed", "error");

    showToast("Deleted!", "success");
    loadTasks();
  } catch {
    showToast("Network error", "error");
  }
}

/* ------------------------------------------------------------
   PAGINATION
------------------------------------------------------------ */
function nextPage() {
  currentPage++;
  loadTasks();
}
function prevPage() {
  if (currentPage > 1) currentPage--;
  loadTasks();
}

/* ------------------------------------------------------------
   DOM READY: BIND BUTTONS SAFELY
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  updateNav();

  const loginBtn = document.querySelector("[data-action='login']");
  if (loginBtn) loginBtn.addEventListener("click", login);

  const registerBtn = document.querySelector("[data-action='register']");
  if (registerBtn) registerBtn.addEventListener("click", registerUser);

  const createBtn = document.querySelector("[data-action='create-task']");
  if (createBtn) createBtn.addEventListener("click", createTask);

  const prevBtn = document.querySelector("[data-action='prev']");
  if (prevBtn) prevBtn.addEventListener("click", prevPage);

  const nextBtn = document.querySelector("[data-action='next']");
  if (nextBtn) nextBtn.addEventListener("click", nextPage);

  // Protect tasks page
  if (window.location.pathname === "/tasks" || window.location.pathname.endsWith("tasks.html")) {
    if (!ensureValidToken()) {
      clearSession();
      return (window.location.href = "/login");
    }
    loadTasks();
  }
});