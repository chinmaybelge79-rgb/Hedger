import { test, expect } from '@playwright/test';

test.describe('Workstream A Reproduction Test: Stock Routing Bug', () => {
  test('Navigating to /company/TCS.NS must display TCS and NOT Reliance Industries', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const heading = await page.locator('h1').textContent();
    console.log('Current Heading on /company/TCS.NS:', heading);

    // This reproduces the bug: currently heading is hard-coded "Reliance Industries Limited"
    expect(heading).not.toContain('Reliance Industries');
    expect(heading).toContain('Tata Consultancy Services');
  });
});
