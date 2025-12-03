const API_BASE = "http://localhost:5000";
let currentPage = 1;

/* ----------------- TOKEN HELPERS ----------------- */

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
  return !!getTokenPayload();
}

/* ----------------- NAVBAR ----------------- */

function updateNav() {
  const navLinks = document.getElementById("nav-links");
  const navUser = document.getElementById("nav-user");
  if (!navLinks || !navUser) return;

  const token = getToken();
  const username = localStorage.getItem("username");

  navLinks.innerHTML = "";

  if (token && ensureValidToken()) {
    navLinks.innerHTML = `
      <a class="nav-link" href="/tasks.html">Tasks</a>
      <a class="nav-link" href="#" id="logoutLink">Logout</a>
    `;
    navUser.innerText = `Hi ${username}`;
    document.getElementById("logoutLink").onclick = logout;
  } else {
    navLinks.innerHTML = `
      <a class="nav-link" href="/login.html">Login</a>
      <a class="nav-link" href="/register.html">Register</a>
    `;
    navUser.innerText = "";
  }
}

function initNavbar() {
  updateNav();
}

/* ----------------- TOAST ----------------- */

function showToast(message, type = "success") {
  const box = document.getElementById("toast-container");
  if (!box) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  box.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/* ----------------- AUTH ----------------- */

async function login() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

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
        window.location.href = "/tasks.html";   // FIXED ABSOLUTE PATH
      }, 300);
    } else {
      showToast(data.msg || "Invalid credentials", "error");
    }
  } catch {
    showToast("Network error!", "error");
  }
}

function logout() {
  clearSession();
  updateNav();
  showToast("Logged out", "success");
  setTimeout(() => {
    window.location.href = "/login.html";  // FIXED
  }, 200);
}

async function registerUser() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  if (!username || !password) {
    showToast("Username and password required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      showToast("Registration successful!", "success");
      setTimeout(() => {
        window.location.href = "/login.html";  // FIXED
      }, 300);
    } else {
      const data = await res.json();
      showToast(data.msg || "Registration failed!", "error");
    }
  } catch {
    showToast("Network error!", "error");
  }
}

/* ----------------- TASKS ----------------- */

async function loadTasks() {
  if (!ensureValidToken()) {
    clearSession();
    window.location.href = "/login.html"; // FIXED
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
    renderTasks(data.tasks || []);
    document.getElementById("pageLabel").innerText = `Page ${currentPage}`;

  } catch {
    showToast("Failed to load tasks", "error");
  }
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.innerHTML = `
      <strong>${task.title}</strong>
      <div class="small">${task.description || ""}</div>
      <div><span class="${task.completed ? "complete-tag" : "incomplete-tag"}">
        ${task.completed ? "Completed" : "Not Completed"}
      </span></div>

      <div class="controls">
        <button class="btn-inline btn-primary" onclick="editTask(${task.id})">Edit</button>
        <button class="btn-inline btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

async function createTask() {
  if (!ensureValidToken()) return logout();

  const title = document.getElementById("title")?.value?.trim();
  const description = document.getElementById("description")?.value?.trim();

  if (!title) return showToast("Title required", "error");

  const token = getToken();

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });

    if (res.ok) {
      showToast("Task created!");
      document.getElementById("title").value = "";
      document.getElementById("description").value = "";
      loadTasks();
    } else showToast("Failed to create task", "error");

  } catch {
    showToast("Error creating task", "error");
  }
}

async function editTask(id) {
  const newTitle = prompt("New title:");
  if (!newTitle) return showToast("Title required", "error");

  const newDesc = prompt("New description:") || "";

  const token = getToken();

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, description: newDesc })
    });

    if (res.ok) {
      showToast("Task updated!");
      loadTasks();
    } else showToast("Update failed", "error");

  } catch {
    showToast("Error updating task", "error");
  }
}

async function deleteTask(id) {
  const token = getToken();

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showToast("Task deleted!");
      loadTasks();
    } else showToast("Delete failed", "error");

  } catch {
    showToast("Error deleting task", "error");
  }
}

function nextPage() {
  currentPage++;
  loadTasks();
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadTasks();
  }
}

/* ----------------- PAGE LOAD ----------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();

  if (window.location.pathname.endsWith("/tasks.html")) {
    if (!ensureValidToken()) {
      window.location.href = "/login.html";  // FIXED
      return;
    }
    loadTasks();
  }
});