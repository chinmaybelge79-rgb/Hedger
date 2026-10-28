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

test.describe('Hedger — SearchModal ESC Button & Watchlist/Saved Suggestions', () => {
  test('SearchModal ESC button does not overlap input and closes modal cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Trigger SearchModal via keyboard shortcut or button
    const searchTrigger = page.locator('button:has-text("Search"), button[aria-label*="Search"], input[placeholder*="Search"]').first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
    } else {
      await page.keyboard.press('Meta+k');
    }

    const modal = page.locator('.search-modal, div[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const input = page.locator('.search-modal-input');
    await expect(input).toBeVisible();

    const escButton = page.locator('kbd:has-text("ESC")');
    await expect(escButton).toBeVisible();

    // Verify geometry and zero overlap
    const inputBox = await input.boundingBox();
    const escBox = await escButton.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(escBox).not.toBeNull();

    if (inputBox && escBox) {
      // ESC button should be placed to the right of the input or cleanly spaced
      expect(escBox.x).toBeGreaterThanOrEqual(inputBox.x + inputBox.width - 2);
      // There should not be any vertical or horizontal collision that obscures text
      expect(escBox.width).toBeGreaterThanOrEqual(24);
      expect(escBox.height).toBeGreaterThanOrEqual(18);
    }

    // Capture screenshot of the cleanly spaced ESC button
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/search_modal_esc_fixed.png'
    });

    // Click ESC button and verify modal closes
    await escButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('Watchlist typing triggers instant famous security suggestions starting with typed letter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Go to profile page watchlist tab
    await page.goto('http://localhost:5173/profile?tab=watchlist');
    await page.waitForLoadState('networkidle');

    // Clear local storage for clean slate
    await page.evaluate(() => localStorage.removeItem('hedger_saved_watchlist'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const watchlistInput = page.locator('input[placeholder*="Add security to watchlist"]');
    await expect(watchlistInput).toBeVisible();

    // Type 'A'
    await watchlistInput.fill('A');

    // Verify suggestions dropdown appears
    const dropdown = page.locator('[data-testid="watchlist-suggestions-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify famous securities from A are suggested
    await expect(dropdown.locator('text=AAPL')).toBeVisible();
    await expect(dropdown.locator('text=Apple Inc.')).toBeVisible();
    await expect(dropdown.locator('text=AMZN')).toBeVisible();

    // Capture screenshot of typing 'A'
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/watchlist_suggestions_typing_a.png'
    });

    // Click on AAPL suggestion
    const aaplItem = page.locator('[data-testid="watchlist-suggestion-AAPL"]');
    await expect(aaplItem).toBeVisible();
    await aaplItem.click();

    // Verify AAPL is now added to the watchlist table
    await expect(page.locator('tbody tr:has-text("Apple Inc.")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('tbody tr:has-text("AAPL")')).toBeVisible();

    // Type 'B' and verify suggestions for B appear
    await watchlistInput.fill('B');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('text=BRK-B')).toBeVisible();

    // Capture screenshot of typing 'B'
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/watchlist_suggestions_typing_b.png'
    });

    // Press Escape to dismiss dropdown
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('Saved models tabs and page provide typing suggestions for famous securities', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Test on Profile Page Tab 3 (/profile?tab=saved)
    await page.goto('http://localhost:5173/profile?tab=saved');
    await page.waitForLoadState('networkidle');

    const profileSavedSearch = page.locator('input[placeholder*="Search saved models or lookup famous security"]');
    await expect(profileSavedSearch).toBeVisible();

    // Type 'A'
    await profileSavedSearch.fill('A');
    const profileDropdown = page.locator('[data-testid="saved-suggestions-dropdown"]');
    await expect(profileDropdown).toBeVisible();
    await expect(profileDropdown.locator('text=AAPL')).toBeVisible();
    await expect(profileDropdown.locator('text=Apple Inc.')).toBeVisible();

    // Capture screenshot of Profile Saved tab suggestions
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/saved_models_profile_suggestions_a.png'
    });

    // Test on Dedicated Saved Page (/saved)
    await page.goto('http://localhost:5173/saved');
    await page.waitForLoadState('networkidle');

    const savedPageSearch = page.locator('input[placeholder*="Search saved models or lookup famous security"]');
    await expect(savedPageSearch).toBeVisible();

    // Type 'A'
    await savedPageSearch.fill('A');
    const savedDropdown = page.locator('[data-testid="saved-suggestions-dropdown"]');
    await expect(savedDropdown).toBeVisible();
    await expect(savedDropdown.locator('text=AAPL')).toBeVisible();
    await expect(savedDropdown.locator('text=Open Model →').first()).toBeVisible();

    // Capture screenshot of Saved Page suggestions
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/saved_page_suggestions_a.png'
    });

    // Click suggestion to launch valuation
    await page.locator('[data-testid="saved-suggestion-AAPL"]').click();
    await page.waitForURL('**/company/AAPL**', { timeout: 10000 });
    expect(page.url()).toContain('/company/AAPL');
  });

  test('SearchModal ESC button and Watchlist suggestions look crisp in Light Theme', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Switch to light theme via localStorage
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('hedger-theme', 'light');
    });

    // 1. Check SearchModal in light theme
    await page.keyboard.press('Meta+k');
    const modal = page.locator('.search-modal, div[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const escButton = page.locator('kbd:has-text("ESC")');
    await expect(escButton).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/search_modal_esc_light_theme.png'
    });

    await escButton.click();
    await expect(modal).not.toBeVisible();

    // 2. Check Watchlist suggestions in light theme
    await page.goto('http://localhost:5173/profile?tab=watchlist');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('hedger-theme', 'light');
    });

    const watchlistInput = page.locator('input[placeholder*="Add security to watchlist"]');
    await expect(watchlistInput).toBeVisible();
    await watchlistInput.fill('A');

    const dropdown = page.locator('[data-testid="watchlist-suggestions-dropdown"]');
    await expect(dropdown).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/watchlist_suggestions_light_theme.png'
    });
  });
});
