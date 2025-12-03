import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {
  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    // 1️⃣ Go to register page
    await page.goto("http://localhost:3000/register.html");

    await page.fill("#username", username);
    await page.fill("#password", password);

    // REGISTER → wait for API only
    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/auth/register") && res.status() === 201
      ),
      page.click("#register-btn"),
    ]);

    await page.goto("http://localhost:3000/login.html");

    // 3️⃣ LOGIN
    await page.fill("#username", username);
    await page.fill("#password", password);

    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/auth/login") && res.status() === 200
      ),
      page.click("#login-btn")
    ]);

    // 🔥 FORCE REDIRECT (CI SAFE)
    await page.goto("http://localhost:3000/tasks.html");

    // 4️⃣ CREATE TASK
    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "Created via E2E");

    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/tasks") && res.status() === 201
      ),
      page.click("text=Create Task"),
    ]);

    // 5️⃣ VERIFY TASK
    await expect(page.locator(".task-item").first()).toContainText("UI Test Task");

    // 6️⃣ LOGOUT
    await page.click("text=Logout");
    await page.goto("http://localhost:3000/login.html");
  });
});