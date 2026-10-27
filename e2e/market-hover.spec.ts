import { test, expect } from '@playwright/test';

test.describe('Hedger — Market Switcher Experience', () => {
  test('Top-right Market button opens on click only (no hover) with professional layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketBtn = page.locator('button[aria-label*="Active market"]');
    await expect(marketBtn).toBeVisible();

    // Verify hover DOES NOT open the dropdown
    await marketBtn.hover();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="market-option-us"]')).toHaveCount(0);

    // Click to open market selector
    await marketBtn.click();

    // Confirm heading "Market Region"
    const heading = page.locator('text=Market Region').first();
    await expect(heading).toBeVisible();

    // Confirm all markets are listed
    await expect(page.locator('[data-testid="market-option-us"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-option-in"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-option-eu"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-option-asia"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-option-all"]')).toBeVisible();

    // Capture screenshot of top-right click popover
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/market_click_popover.png' });

    // Click again to close
    await marketBtn.click();
    await expect(page.locator('[data-testid="market-option-us"]')).toHaveCount(0);
  });

  test('Center navigation Markets link is a clean direct link without dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const navMarketsLink = page.locator('nav.nav-links-list a[href="/markets"]').first();
    await expect(navMarketsLink).toBeVisible();
    await expect(navMarketsLink).toHaveText('Markets');

    // Hover over nav Markets link and verify NO dropdown opens here
    await navMarketsLink.hover();
    await page.waitForTimeout(400);
    const centerFlyout = page.locator('nav.nav-links-list').locator('text=Market Region');
    await expect(centerFlyout).toHaveCount(0);

    // Clicking it navigates directly to /markets
    await navMarketsLink.click();
    await page.waitForURL('**/markets');
    await expect(page).toHaveURL(/.*\/markets/);
  });
});
