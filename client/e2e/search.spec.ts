import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('opens search with Ctrl+K', async ({ page }) => {
    await page.goto('/');

    // Wait for concept map selector to load
    await page.waitForSelector('text=Principle');

    // Open search with keyboard shortcut
    await page.keyboard.press('Control+k');

    // Verify search bar appears
    await expect(page.locator('[placeholder="Search nodes..."]')).toBeVisible();
  });

  test('searches for nodes', async ({ page }) => {
    await page.goto('/');

    // Open search
    await page.keyboard.press('Control+k');

    // Type search query
    const searchInput = page.locator('[placeholder="Search nodes..."]');
    await searchInput.fill('test');

    // Wait for results (if any exist)
    // This test assumes there's at least one node with "test" in its title/content
    await page.waitForTimeout(300); // Debounce delay
  });

  test('closes search with Escape', async ({ page }) => {
    await page.goto('/');

    // Open search
    await page.keyboard.press('Control+k');
    await expect(page.locator('[placeholder="Search nodes..."]')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');

    // Search should be closed
    await expect(page.locator('[placeholder="Search nodes..."]')).not.toBeVisible();
  });
});
