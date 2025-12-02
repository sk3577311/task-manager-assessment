import { test, expect } from '@playwright/test';

const TEST_USER = "playuser";
const TEST_PASS = "playpass123";

let token = "";

test.describe("TASK MANAGER API", () => {

  test("Register user", async ({ request }) => {
    const res = await request.post("/auth/register", {
      data: { username: TEST_USER, password: TEST_PASS, role: "user" }
    });

    expect(res.status()).toBe(201);
  });

  test("Login user", async ({ request }) => {
    const res = await request.post("/auth/login", {
      data: { username: TEST_USER, password: TEST_PASS }
    });

    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.access_token).toBeTruthy();

    token = body.access_token;
  });

  test("Create a task", async ({ request }) => {
    const res = await request.post("/tasks", {
      data: { title: "Test Task", description: "Created via Playwright" },
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.title).toBe("Test Task");
  });

  test("Get tasks list", async ({ request }) => {
    const res = await request.get("/tasks?page=1&per_page=5", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(Array.isArray(body.tasks)).toBeTruthy();
  });

  test("Update task", async ({ request }) => {
    // First get a task
    const tasksRes = await request.get("/tasks?page=1&per_page=5", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tasks = (await tasksRes.json()).tasks;
    expect(tasks.length).toBeGreaterThan(0);

    const taskId = tasks[0].id;

    const res = await request.put(`/tasks/${taskId}`, {
      data: { title: "Updated Task Title" },
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.ok()).toBeTruthy();
  });

  test("Delete task", async ({ request }) => {
    const tasksRes = await request.get("/tasks?page=1&per_page=5", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tasks = (await tasksRes.json()).tasks;
    const taskId = tasks[0].id;

    const res = await request.delete(`/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.ok()).toBeTruthy();
  });

});
