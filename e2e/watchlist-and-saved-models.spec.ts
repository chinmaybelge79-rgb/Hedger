import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill('Chinusha4love$$');
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('Hedger — Watchlist Real Market Data & Zero Default Models', () => {
  test('Profile page watchlist starts clean and adding security fetches real price (not fake $150)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Go to profile page watchlist tab
    await page.goto('http://localhost:5173/profile?tab=watchlist');
    await page.waitForLoadState('networkidle');

    // Clear local storage to guarantee clean slate test
    await page.evaluate(() => localStorage.removeItem('hedger_saved_watchlist'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Confirm clean empty state when no securities added
    await expect(page.locator('text=No securities in your watchlist')).toBeVisible();

    // Find input and add 'AAPL'
    const input = page.locator('input[placeholder*="Add security to watchlist"]');
    await expect(input).toBeVisible();
    await input.fill('AAPL');
    await page.locator('button:has-text("Add Security")').click();

    // Verify AAPL is added to watchlist with real company profile
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    await expect(page.locator('text=AAPL · NASDAQ')).toBeVisible();

    // Verify price is NOT the fake $150.00
    const row = page.locator('tr:has-text("AAPL")');
    await expect(row).toBeVisible();
    const rowText = await row.innerText();
    expect(rowText).not.toContain('$150.00');

    // Refresh the page and confirm AAPL persists without resetting to default 6 dummy securities
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    // Verify none of the old default 6 securities were forced in
    await expect(page.locator('text=HDFCBANK.NS')).toHaveCount(0);

    // Take screenshot of watchlist with real price
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/profile_watchlist_real_price.png' });
  });

  test('Saved models page and profile saved tab show zero dummy models by default', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Visit /profile?tab=saved
    await page.goto('http://localhost:5173/profile?tab=saved');
    await page.waitForLoadState('networkidle');

    // Verify none of the 3 old dummy seed models ever appear
    await expect(page.locator('text=Retail and digital growth offset the energy cycle')).toHaveCount(0);
    await expect(page.locator('text=Retail and digital margins expand')).toHaveCount(0);
    await expect(page.locator('text=High ROE quality compounder with strong operating cash flow')).toHaveCount(0);

    // If there is any leftover test model, delete it to verify delete mechanism and empty state
    const deleteButtons = page.locator('button:has-text("Delete")');
    const deleteCount = await deleteButtons.count();
    for (let i = 0; i < deleteCount; i++) {
      await page.locator('button:has-text("Delete")').first().click();
      await page.waitForTimeout(300);
    }

    // After deleting or if none saved, verify clean institutional empty state
    await expect(page.locator('text=No saved valuation models yet')).toBeVisible();

    // Refresh page: confirm dummy models DO NOT reappear upon refresh!
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=No saved valuation models yet')).toBeVisible();
    await expect(page.locator('text=Retail and digital margins expand')).toHaveCount(0);

    // Take screenshot of clean saved state
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/saved_models_clean_zero_defaults.png' });
  });

  test('Market selector opens strictly on click and has professional compact copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketBtn = page.locator('button[aria-label*="Active market"]');
    await expect(marketBtn).toBeVisible();

    // Hover should NOT open
    await marketBtn.hover();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="market-option-us"]')).toHaveCount(0);

    // Click opens
    await marketBtn.click();
    await expect(page.locator('text=Market Region')).toBeVisible();
    await expect(page.locator('[data-testid="market-option-us"]')).toBeVisible();

    // Words check: no "Screen market →" or long marketing copy
    await expect(page.locator('text=Screen market →')).toHaveCount(0);
    await expect(page.locator('text=Markets Available on Hedger')).toHaveCount(0);
    await expect(page.locator('text=Select any market to screen stocks')).toHaveCount(0);

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="market-option-us"]')).toHaveCount(0);
  });
});
