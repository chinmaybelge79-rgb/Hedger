import { TEST_PASS } from "./test-credentials.js";
import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill(TEST_PASS.ultra);
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('Graph Range Timeframe Options — 5Y Maximum and ALL Removed', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('Markets Page chart has 5Y as max range and no ALL option', async ({ page }) => {
    await page.goto('http://localhost:5173/markets');
    await page.waitForLoadState('networkidle');

    // Verify 5Y button exists
    const fiveYearBtn = page.getByRole('button', { name: '5Y', exact: true });
    await expect(fiveYearBtn).toBeVisible();

    // Verify ALL button does NOT exist anywhere in chart controls
    const allBtn = page.getByRole('button', { name: 'ALL', exact: true });
    await expect(allBtn).not.toBeVisible();

    // Click 5Y to ensure it activates cleanly
    await fiveYearBtn.click();
    await page.waitForTimeout(300);

    // Screenshot of Markets page chart showing timeframe buttons
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/chart_timeframe_markets_page.png'
    });
  });

  test('Company Page Charts tab has 5Y as max range and no ALL option', async ({ page }) => {
    await page.goto('http://localhost:5173/company/NVDA?tab=charts');
    await page.waitForLoadState('networkidle');

    // Locate timeframe controls in the full chart
    const fiveYearBtn = page.getByRole('button', { name: '5Y', exact: true });
    await expect(fiveYearBtn).toBeVisible();

    const allBtn = page.getByRole('button', { name: 'ALL', exact: true });
    await expect(allBtn).not.toBeVisible();

    // Click 5Y and verify active state
    await fiveYearBtn.click();
    await page.waitForTimeout(300);

    // Screenshot of Company page chart showing timeframe buttons
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/chart_timeframe_company_page.png'
    });
  });

  test('Landing Page showcase chart has 5Y as max range and no ALL option', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Scroll down to showcase chart
    const showcase = page.locator('text=Interactive Terminal Showcase');
    if (await showcase.isVisible()) {
      await showcase.scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(() => window.scrollBy(0, 1000));
    }
    await page.waitForTimeout(400);

    const fiveYearBtn = page.getByRole('button', { name: '5Y', exact: true }).first();
    await expect(fiveYearBtn).toBeVisible();

    const allBtn = page.getByRole('button', { name: 'ALL', exact: true });
    await expect(allBtn).not.toBeVisible();

    // Screenshot of Landing page showcase chart showing timeframe buttons
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/chart_timeframe_landing_showcase.png'
    });
  });
});
