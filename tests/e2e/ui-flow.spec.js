import { test, expect } from '@playwright/test';

test.describe("UI FLOW", () => {

  test("User registers, logs in, and creates a task", async ({ page }) => {
    await page.goto("http://localhost:3000/register.html");

    // register
    await page.fill("#username", "ui_test_user");
    await page.fill("#password", "password123");
    await page.click("text=Register");

    // login
    await page.goto("http://localhost:3000/login.html");
    await page.fill("#username", "ui_test_user");
    await page.fill("#password", "password123");
    await page.click("text=Login");

    await page.waitForURL("**/tasks.html");

    // create task
    await page.fill("#title", "UI Test Task");
    await page.fill("#description", "This is a UI-created task.");
    await page.click("text=Create Task");

    // verify task shows
    await expect(page.locator(".task-item")).toContainText("UI Test Task");
  });

});
