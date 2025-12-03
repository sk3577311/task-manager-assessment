const API_BASE = "http://localhost:5000";
let currentPage = 1;

// ---------------- TOKEN HELPERS ----------------
function getToken() {
  return localStorage.getItem("token");
}
function setToken(token) {
  token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
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
  if (!token) return false;
  return !!getTokenPayload();
}

// ---------------- NAVBAR ----------------
function updateNav() {
  const navLinks = document.getElementById("nav-links");
  const navUser = document.getElementById("nav-user");
  if (!navLinks || !navUser) return;

  const loggedIn = ensureValidToken();
  const username = localStorage.getItem("username");

  navLinks.innerHTML = "";

  if (loggedIn) {
    navLinks.innerHTML = `
      <a href="/tasks" class="nav-link">Tasks</a>
      <a href="#" id="logoutBtn" class="nav-link">Logout</a>
    `;
    navUser.innerText = username ? `Hi ${username}` : "";

    document.getElementById("logoutBtn").onclick = (e) => {
      e.preventDefault();
      logout();
    };

  } else {
    navLinks.innerHTML = `
      <a href="/login" class="nav-link">Login</a>
      <a href="/register" class="nav-link">Register</a>
    `;
    navUser.innerText = "";
  }
}

function initNavbar() {
  updateNav();
}

// ---------------- TOAST ----------------
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---------------- AUTH ----------------
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return showToast("Username and password required", "error");

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast(data.msg || "Login failed", "error");
    return;
  }

  setToken(data.access_token);
  localStorage.setItem("username", username);
  showToast("Login successful", "success");

  window.location.href = "/tasks";
}

async function registerUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return showToast("All fields required", "error");

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) return showToast(data.msg || "Registration failed", "error");

  showToast("Registration successful", "success");
  window.location.href = "/login";
}

function logout() {
  clearSession();
  showToast("Logged out", "success");
  window.location.href = "/login";
}

// ---------------- TASKS ----------------
async function loadTasks() {
  if (!ensureValidToken()) {
    clearSession();
    return window.location.href = "/login";
  }

  const token = getToken();
  const url = `${API_BASE}/tasks?page=${currentPage}&per_page=5`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  renderTasks(data.tasks);
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task-item";

    div.innerHTML = `
      <strong>${t.title}</strong>
      <div class="small">${t.description || ""}</div>
      <div><span class="${t.completed ? "complete-tag" : "incomplete-tag"}">${t.completed ? "Completed" : "Not Completed"}</span></div>
    `;

    list.appendChild(div);
  });
}

async function createTask() {
  if (!ensureValidToken()) return window.location.href = "/login";

  const token = getToken();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title) return showToast("Title required", "error");

  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description })
  });

  if (!res.ok) return showToast("Creation failed", "error");

  showToast("Task created", "success");
  loadTasks();
}

// ---------------- ON LOAD ----------------
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();

  if (window.location.pathname === "/tasks") {
    if (!ensureValidToken()) {
      clearSession();
      return window.location.href = "/login";
    }
    loadTasks();
  }
});