import { test, expect } from '@playwright/test';

test.describe('PC Buying Process E2E Tests', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    // Verify we are on the home page
    await expect(page).toHaveTitle(/Repur.fi/);
    // Check for a prominent element on the home page, e.g., a heading or a product listing
    await expect(page.locator('h1, h2, h3').first()).toContainText(/huipputeknologia/i);
  });
});
