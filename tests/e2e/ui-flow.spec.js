import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {

  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    await page.goto("http://localhost:3000/register.html");

    await page.fill("#username", username);
    await page.fill("#password", password);

    // WAIT FOR REGISTER API CALL
    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/auth/register") && res.status() === 201
      ),
      page.click("#register-btn"),
    ]);

    await page.waitForURL("**/login.html");

    // LOGIN
    await page.fill("#username", username);
    await page.fill("#password", password);
    await Promise.all([
      page.waitForURL("**/tasks.html"),
      page.click("text=Login"),
    ]);

    // CREATE TASK
    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "This is a task created during E2E test.");

    await Promise.all([
      page.waitForResponse(res =>
        res.url().includes("/tasks") && res.status() === 201
      ),
      page.click("text=Create Task"),
    ]);

    // VERIFY TASK
    await expect(page.locator(".task-item").first()).toContainText("UI Test Task");

    // LOGOUT
    await Promise.all([
      page.waitForURL("**/login.html"),
      page.click("text=Logout"),
    ]);
  });

});