import { test, expect } from "@playwright/test";

test.describe("UI FLOW — Register → Login → Create Task", () => {

  test("User registers, logs in, creates a task, sees it, and logs out", async ({ page }) => {

    // ----------------------------
    // 1) REGISTER NEW USER
    // ----------------------------
    const username = `ui_user_${Date.now()}`;
    const password = "password123";

    await page.goto("http://localhost:3000/register.html", {
      waitUntil: "domcontentloaded",
    });

    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("text=Register");

    // registration redirects to login page
    await page.waitForURL("**/login.html");

    // ----------------------------
    // 2) LOGIN WITH NEW USER
    // ----------------------------
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("text=Login");

    await page.waitForURL("**/tasks.html");

    // ----------------------------
    // 3) CREATE A TASK
    // ----------------------------
    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "This is a task created during E2E test.");
    await page.click("text=Create Task");

    // Wait for tasks to load after creation
    await page.waitForTimeout(1000);

    // ----------------------------
    // 4) VERIFY TASK APPEARS
    // ----------------------------

    // Your tasks are rendered inside: <div id="taskList">
    // Each task looks like: <div class="task-item"> ... </div>
    // If your class name is different, update here accordingly:
    const firstTask = page.locator(".task-item").first();

    await expect(firstTask).toContainText("UI Test Task");

    // ----------------------------
    // 5) LOGOUT → should return to login page
    // ----------------------------
    await page.click("text=Logout");
    await page.waitForURL("**/login.html");
  });

});
