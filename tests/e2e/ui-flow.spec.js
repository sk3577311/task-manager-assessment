import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {
  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    // 1️⃣ Go to register page
    await page.goto("http://localhost:3000/register.html");

    await page.fill("#username", username);
    await page.fill("#password", password);

    // 2️⃣ Wait for REGISTER API + redirect
    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/auth/register") && res.status() === 201
      ),
      page.click("#register-btn"),   // FIXED
    ]);

    await page.waitForURL(/.*login(\.html)?$/);

    // 3️⃣ LOGIN
    await page.fill("#username", username);
    await page.fill("#password", password);

    await Promise.all([
      page.waitForURL(/.*tasks(\.html)?$/),
      page.click("#login-btn"),   // FIXED
    ]);

    // 4️⃣ CREATE TASK
    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/tasks") && res.status() === 201
      ),
      page.fill("#title", "UI Test Task"),
      page.fill("#description", "This is a task created during E2E test."),
      page.click("text=Create Task"),
    ]);

    // 5️⃣ VERIFY TASK
    await expect(page.locator(".task-item").first()).toContainText("UI Test Task");

    // 6️⃣ LOGOUT
    await Promise.all([
      page.waitForURL(/.*login(\.html)?$/),
      page.click("text=Logout"),
    ]);
  });
});