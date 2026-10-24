import { test, expect } from '@playwright/test';

test.describe('M0 Baseline E2E Suite', () => {
  const routes = [
    { path: '/', name: 'Landing' },
    { path: '/markets', name: 'Markets' },
    { path: '/company/RELIANCE.NS', name: 'Company Dossier' },
    { path: '/models', name: 'DCF Valuation' },
    { path: '/screener', name: 'Screener' },
    { path: '/saved', name: 'Saved Models' },
    { path: '/design', name: 'Design Catalog' }
  ];

  for (const { path, name } of routes) {
    test(`Route ${path} (${name}) loads with 200 and no leakage`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      // Wait for network idle or main content to mount
      await page.waitForLoadState('domcontentloaded');

      // Check text content for leakage
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/\bNaN\b/);
      expect(bodyText).not.toMatch(/\[object Object\]/);
      expect(bodyText).not.toMatch(/Invalid Date/);

      // Verify no horizontal overflow at body level
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for subpixel rounding
    });
  }

  test('Global Spotlight ⌘K search modal opens and dismisses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click search trigger in navbar or press Control+K
    const searchTrigger = page.locator('button[title*="Search"]');
    await searchTrigger.click({ force: true });

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify ESC closes it
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});