// =====================================================
// CONFIG
// =====================================================

const API_BASE = "http://localhost:5000";
const FRONTEND_BASE = "http://localhost:3000";
let currentPage = 1;


// =====================================================
// TOKEN HELPERS
// =====================================================

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
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

function ensureValidToken() {
  const token = getToken();
  if (!token || token === "undefined" || token === "null") return false;

  const payload = getTokenPayload();
  if (!payload) return false;

  return true;
}


// =====================================================
// NAVBAR
// =====================================================

function updateNav() {
  const navLinks = document.getElementById("nav-links");
  const navUser = document.getElementById("nav-user");

  if (!navLinks || !navUser) return;

  const token = getToken();
  const username = localStorage.getItem("username");

  navLinks.innerHTML = "";

  if (token && ensureValidToken()) {
    const tasksLink = document.createElement("a");
    tasksLink.href = "tasks.html";
    tasksLink.innerText = "Tasks";

    const logoutBtn = document.createElement("a");
    logoutBtn.href = "#";
    logoutBtn.innerText = "Logout";
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      logout();
    };

    navLinks.appendChild(tasksLink);
    navLinks.appendChild(logoutBtn);
    navUser.innerText = `Hi ${username}`;
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.innerText = "Login";

    const registerLink = document.createElement("a");
    registerLink.href = "register.html";
    registerLink.innerText = "Register";

    navLinks.appendChild(loginLink);
    navLinks.appendChild(registerLink);
    navUser.innerText = "";
  }
}

function initNavbar() {
  updateNav();
}


// =====================================================
// TOASTS
// =====================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// =====================================================
// AUTH — LOGIN / LOGOUT / REGISTER
// =====================================================

async function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) {
    showToast("Username and password required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("username", username);

      showToast("Login successful!", "success");

      setTimeout(() => {
        window.location.href = `${FRONTEND_BASE}/tasks.html`; // ABSOLUTE URL FIX
      }, 300);

    } else {
      showToast(data.msg || "Login failed", "error");
    }
  } catch {
    showToast("Network error", "error");
  }
}


function logout() {
  clearSession();
  showToast("Logged out");

  setTimeout(() => {
    window.location.href = `${FRONTEND_BASE}/login.html`; // ABSOLUTE URL FIX
  }, 200);
}


async function registerUser() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) {
    showToast("All fields required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Registered successfully!", "success");

      setTimeout(() => {
        window.location.href = `${FRONTEND_BASE}/login.html`; // ABSOLUTE URL FIX
      }, 300);

    } else {
      showToast(data.msg || "Registration failed", "error");
    }
  } catch {
    showToast("Network error", "error");
  }
}


// =====================================================
// TASK CRUD
// =====================================================

async function loadTasks() {
  if (!ensureValidToken()) {
    clearSession();
    window.location.href = `${FRONTEND_BASE}/login.html`; // FIX
    return;
  }

  const token = getToken();
  const filter = document.getElementById("filter")?.value || "all";

  let url = `${API_BASE}/tasks?page=${currentPage}&per_page=5`;
  if (filter !== "all") url += `&completed=${filter}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      renderTasks(data.tasks);
      document.getElementById("pageLabel").innerText = `Page ${currentPage}`;
    } else {
      showToast("Failed to load tasks", "error");
    }

  } catch {
    showToast("Network error", "error");
  }
}

function renderTasks(tasks = []) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-item";

    div.innerHTML = `
      <strong>${task.title}</strong>
      <div class="small">${task.description || ""}</div>
      <div>
        <span class="${task.completed ? 'complete-tag' : 'incomplete-tag'}">
          ${task.completed ? "Completed" : "Not Completed"}
        </span>
      </div>
      <div style="margin-top: 8px;">
        <button class="btn-inline btn-primary" onclick="editTask(${task.id})">Edit</button>
        <button class="btn-inline btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    list.appendChild(div);
  });
}

async function createTask() {
  if (!ensureValidToken()) return logout();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

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

    if (!res.ok) return showToast("Create failed", "error");

    showToast("Task created!");

    document.getElementById("title").value = "";
    document.getElementById("description").value = "";

    loadTasks();

  } catch {
    showToast("Network error", "error");
  }
}


async function editTask(id) {
  const newTitle = prompt("New title:");
  if (!newTitle) return;

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

    showToast("Task updated");
    loadTasks();

  } catch {
    showToast("Network error", "error");
  }
}


async function deleteTask(id) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!res.ok) return showToast("Delete failed", "error");

    showToast("Task deleted");
    loadTasks();

  } catch {
    showToast("Network error", "error");
  }
}


// =====================================================
// PAGINATION
// =====================================================

function nextPage() {
  currentPage++;
  loadTasks();
}

function prevPage() {
  if (currentPage > 1) currentPage--;
  loadTasks();
}


// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();

  if (window.location.pathname.endsWith("tasks.html")) {
    if (!ensureValidToken()) {
      window.location.href = `${FRONTEND_BASE}/login.html`;
      return;
    }
    loadTasks();
  }
});