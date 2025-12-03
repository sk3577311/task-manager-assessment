// task-ui/app.js
const API_BASE = "http://localhost:5000";
let currentPage = 1;

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
  } catch (e) {
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

/* -------------------------
   NAV / HEADER
   ------------------------- */
function updateNav() {
  const navLinks = document.getElementById("nav-links");
  const navUser = document.getElementById("nav-user");

  if (!navLinks || !navUser) return; // nothing to do if nav not present

  const token = getToken();
  const username = localStorage.getItem("username");

  navLinks.innerHTML = "";

  if (token && ensureValidToken()) {
    const tasksLink = document.createElement("a");
    tasksLink.href = "/tasks.html";
    tasksLink.innerText = "Tasks";
    tasksLink.className = "nav-link";

    const logoutBtn = document.createElement("a");
    logoutBtn.href = "#";
    logoutBtn.innerText = "Logout";
    logoutBtn.onclick = (e) => { e.preventDefault(); logout(); };

    navLinks.appendChild(tasksLink);
    navLinks.appendChild(logoutBtn);

    navUser.innerText = username ? `Hi ${username}` : "";
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "/login.html";
    loginLink.innerText = "Login";
    loginLink.className = "nav-link";

    const registerLink = document.createElement("a");
    registerLink.href = "/register.html";
    registerLink.innerText = "Register";
    registerLink.className = "nav-link";

    navLinks.appendChild(loginLink);
    navLinks.appendChild(registerLink);

    navUser.innerText = "";
  }
}

function initNavbar() {
  updateNav();
}

/* -------------------------
   TOASTS & UI HELPERS
   ------------------------- */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) {
    // fallback: console
    console.log(`[toast ${type}] ${message}`);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

/* -------------------------
   AUTH: LOGIN / REGISTER
   ------------------------- */
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

    const data = await res.json().catch(()=>null);

    if (res.ok && data && data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("username", username);
      updateNav();
      showToast("Login successful!", "success");
      console.log("Login success - redirecting to /tasks.html");
      // absolute redirect so Playwright sees the navigation
      window.location.href = "/tasks.html";
    } else {
      showToast((data && (data.msg || data.message)) || "Invalid credentials", "error");
      console.warn("Login failed", data);
    }
  } catch (e) {
    showToast("Network error!", "error");
    console.error("Login error", e);
  }
}

function logout() {
  clearSession();
  updateNav();
  showToast("Logged out", "success");
  console.log("Logged out - redirecting to /login.html");
  window.location.href = "/login.html";
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

    const data = await res.json().catch(()=>null);

    if (res.ok) {
      showToast("Registration successful!", "success");
      console.log("Registered - redirecting to /login.html");
      // immediate absolute redirect (no timeouts)
      window.location.href = "/login.html";
    } else {
      showToast((data && (data.msg || data.message)) || "Registration failed!", "error");
      console.warn("Registration failed", data);
    }
  } catch (e) {
    showToast("Network error!", "error");
    console.error("Register error", e);
  }
}

/* -------------------------
   TASKS: load / render / CRUD
   ------------------------- */
async function loadTasks() {
  if (!ensureValidToken()) {
    clearSession();
    updateNav();
    window.location.href = "/login.html";
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

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      showToast("Failed to load tasks", "error");
      console.warn("Load tasks failed", { status: res.status, data });
      return;
    }

    renderTasks(data.tasks || []);
    const pageLabel = document.getElementById("pageLabel");
    if (pageLabel) pageLabel.innerText = `Page ${currentPage}`;
  } catch (e) {
    showToast("Failed to load tasks", "error");
    console.error("loadTasks error", e);
  }
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task-item";

    const title = document.createElement("strong");
    title.innerText = t.title;

    const desc = document.createElement("div");
    desc.className = "small";
    desc.innerText = t.description || "";

    const status = document.createElement("div");
    status.innerHTML = `<span class="${t.completed ? "complete-tag" : "incomplete-tag"}">${t.completed ? "Completed" : "Not Completed"}</span>`;

    const controls = document.createElement("div");
    controls.style.marginTop = "8px";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-inline btn-primary";
    editBtn.innerText = "Edit";
    editBtn.onclick = () => promptEditTask(t.id, t.title, t.description);

    const delBtn = document.createElement("button");
    delBtn.className = "btn-inline btn-danger";
    delBtn.innerText = "Delete";
    delBtn.onclick = () => deleteTask(t.id);

    controls.appendChild(editBtn);
    controls.appendChild(delBtn);

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(status);
    div.appendChild(controls);

    list.appendChild(div);
  });
}

async function createTask() {
  if (!ensureValidToken()) {
    clearSession(); updateNav(); window.location.href = "/login.html"; return;
  }

  const token = getToken();
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const title = titleEl?.value?.trim();
  const description = descEl?.value?.trim();

  if (!title) {
    showToast("Title is required!", "error"); return;
  }

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });

    if (!res.ok) {
      const data = await res.json().catch(()=>null);
      showToast((data && (data.msg || data.message)) || "Failed to create task!", "error");
      console.warn("Create task failed", { status: res.status, data });
      return;
    }

    showToast("Task created!", "success");
    if (titleEl) titleEl.value = "";
    if (descEl) descEl.value = "";
    // small delay so backend has written the task then reload
    setTimeout(loadTasks, 300);
  } catch (e) {
    showToast("Failed to create task!", "error");
    console.error("createTask error", e);
  }
}

function promptEditTask(id, currentTitle = "", currentDesc = "") {
  const newTitle = prompt("New title:", currentTitle);
  if (!newTitle) {
    showToast("Title is required!", "error");
    return;
  }
  const newDesc = prompt("New description:", currentDesc);
  updateTask(id, newTitle, newDesc);
}

async function updateTask(id, title, description) {
  if (!ensureValidToken()) { clearSession(); updateNav(); window.location.href="/login.html"; return; }

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });

    if (!res.ok) {
      const data = await res.json().catch(()=>null);
      showToast((data && (data.msg || data.message)) || "Update failed!", "error");
      console.warn("Update task failed", { status: res.status, data });
      return;
    }
    showToast("Task updated!", "success");
    setTimeout(loadTasks, 200);
  } catch (e) {
    showToast("Update failed!", "error");
    console.error("updateTask error", e);
  }
}

async function deleteTask(id) {
  if (!ensureValidToken()) { clearSession(); updateNav(); window.location.href="/login.html"; return; }

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(()=>null);
      showToast((data && (data.msg || data.message)) || "Delete failed!", "error");
      console.warn("Delete task failed", { status: res.status, data });
      return;
    }
    showToast("Task deleted!", "success");
    setTimeout(loadTasks, 200);
  } catch (e) {
    showToast("Delete failed!", "error");
    console.error("deleteTask error", e);
  }
}

/* -------------------------
   PAGINATION
   ------------------------- */
function nextPage() {
  currentPage++;
  loadTasks();
}

function prevPage() {
  if (currentPage > 1) { currentPage--; loadTasks(); }
}

/* -------------------------
   INIT
   ------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();

  // If we are on tasks page, protect it immediately
  if (window.location.pathname.includes("tasks.html")) {
    if (!ensureValidToken()) {
      clearSession();
      updateNav();
      window.location.href = "/login.html";
      return;
    }
    loadTasks();
  }
});