import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {

  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    // ----------------------------
    // 1) OPEN REGISTER PAGE (WAIT FOR FULL LOAD)
    // ----------------------------
    await page.goto("http://localhost:3000/register.html", {
      waitUntil: "load",
    });

    // Ensure JS + inputs are loaded
    await page.waitForSelector("#username", { timeout: 10000 });
    await page.waitForSelector("#password", { timeout: 10000 });
    await page.waitForSelector("text=Register", { timeout: 10000 });

    // ----------------------------
    // 2) REGISTER NEW USER
    // ----------------------------
    await page.fill("#username", username);
    await page.fill("#password", password);

    await Promise.all([
      page.waitForURL("**/login.html", { timeout: 15000 }),
      page.click("text=Register"),
    ]);

    // ----------------------------
    // 3) LOGIN WITH NEW USER
    // ----------------------------
    await page.waitForSelector("#username");
    await page.fill("#username", username);
    await page.fill("#password", password);

    await Promise.all([
      page.waitForURL("**/tasks.html", { timeout: 15000 }),
      page.click("text=Login"),
    ]);

    // ----------------------------
    // 4) CREATE A NEW TASK
    // ----------------------------
    await page.waitForSelector("#title", { timeout: 10000 });

    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "This is a task created during E2E test.");

    await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes("/tasks") && res.status() === 201
      ),
      page.click("text=Create Task"),
    ]);

    // Give UI time to re-render
    await page.waitForTimeout(500);

    // ----------------------------
    // 5) VERIFY TASK APPEARS
    // ----------------------------
    const firstTask = page.locator(".task-item").first();
    await firstTask.waitFor({ timeout: 10000 });

    await expect(firstTask).toContainText("UI Test Task");

    // ----------------------------
    // 6) LOGOUT
    // ----------------------------
    await Promise.all([
      page.waitForURL("**/login.html", { timeout: 15000 }),
      page.click("text=Logout"),
    ]);
  });

});