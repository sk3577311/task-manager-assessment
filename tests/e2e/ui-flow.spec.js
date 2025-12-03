import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {

  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    // ----------------------------
    // 1) OPEN REGISTER PAGE
    // ----------------------------
    await page.goto("http://localhost:3000/register.html", {
      waitUntil: "load",
    });

    await page.waitForSelector("#username", { timeout: 20000 });

    // ----------------------------
    // 2) REGISTER USER → WAIT FOR API CALL
    // ----------------------------
    const registerPromise = page.waitForResponse(
      (res) => res.url().includes("/auth/register") && res.status() === 201,
      { timeout: 20000 }
    );

    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("text=Register");

    // Wait for backend success
    await registerPromise;

    // NOW wait for redirect (your frontend delays redirect by 600ms!)
    await page.waitForURL("**/login.html", { timeout: 20000 });

    // ----------------------------
    // 3) LOGIN
    // ----------------------------
    await page.waitForSelector("#username", { timeout: 15000 });

    const loginPromise = page.waitForResponse(
      (res) => res.url().includes("/auth/login") && res.status() === 200
    );

    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("text=Login");

    await loginPromise;
    await page.waitForURL("**/tasks.html", { timeout: 20000 });

    // ----------------------------
    // 4) CREATE TASK
    // ----------------------------
    await page.waitForSelector("#title");

    const createTaskPromise = page.waitForResponse(
      (res) => res.url().includes("/tasks") && res.status() === 201
    );

    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "E2E CI task");
    await page.click("text=Create Task");

    await createTaskPromise;

    // wait for UI to re-render
    await page.waitForTimeout(500);

    const firstTask = page.locator(".task-item").first();
    await expect(firstTask).toContainText("UI Test Task");

    // ----------------------------
    // 5) LOGOUT
    // ----------------------------
    await Promise.all([
      page.waitForURL("**/login.html"),
      page.click("text=Logout"),
    ]);
  });
});