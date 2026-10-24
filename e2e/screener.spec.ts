import { test, expect } from '@playwright/test';

test.describe('Workstream Screener — Global Multi-Market, Filter Options, Realistic Compare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/screener', { waitUntil: 'networkidle' });
  });

  test('Loads global universe with multi-market companies and active default filters', async ({ page }) => {
    // Assert Header & Subtitle
    await expect(page.locator('h1')).toHaveText('Screener');
    await expect(page.getByText('Global multi-market feed')).toBeVisible();

    // Assert Table rows exist
    const rows = page.locator('table.koyfin-table tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verify presence of global symbols across multiple currencies ($, €, ¥, HK$, or ₹)
    const tableText = await page.locator('table.koyfin-table').innerText();
    expect(tableText).toMatch(/\$|₹|€|¥|HK\$|CHF|£/);
  });

  test('Switching market regions filters companies dynamically', async ({ page }) => {
    // 1. Switch to India · NSE
    const indiaBtn = page.locator('button:has-text("India · NSE")');
    await expect(indiaBtn).toBeVisible();
    await indiaBtn.click();
    await page.waitForTimeout(300);

    // Assert Indian companies appear with ₹ currency
    await expect(page.locator('table.koyfin-table')).toContainText('₹');
    await expect(page.locator('table.koyfin-table')).toContainText('.NS');

    // 2. Switch to United States · US
    const usBtn = page.locator('button:has-text("United States · US")');
    await expect(usBtn).toBeVisible();
    await usBtn.click();
    await page.waitForTimeout(300);

    // Assert US companies appear with $ currency
    await expect(page.locator('table.koyfin-table')).toContainText('$');

    // 3. Switch back to All Markets (Global)
    const allBtn = page.locator('button:has-text("All Markets (Global)")');
    await expect(allBtn).toBeVisible();
    await allBtn.click();
    await page.waitForTimeout(300);
  });

  test('Add filter dropdown allows choosing and removing filters', async ({ page }) => {
    // Click + Add filter button
    const addFilterBtn = page.locator('button:has-text("+ Add filter")');
    await expect(addFilterBtn).toBeVisible();
    await addFilterBtn.click();

    // Assert popover appears with categories
    const popover = page.locator('text=Select Filter to Apply');
    await expect(popover).toBeVisible();

    // Click on Sector category and select Technology
    const techBtn = page.locator('button:has-text("Sector: Technology")');
    await expect(techBtn).toBeVisible();
    await techBtn.click();

    // Assert Technology filter chip is added to filter bar
    await expect(page.locator('.filter-chips-bar')).toContainText('Sector: Technology');

    // Remove a filter chip using the × button
    const removeBtn = page.locator('.filter-chip', { hasText: 'Sector: Technology' }).locator('button');
    await removeBtn.click();
    await expect(page.locator('.filter-chips-bar')).not.toContainText('Sector: Technology');
  });

  test('Instant search input filters by company name and symbol', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search company"]');
    await expect(searchInput).toBeVisible();

    // Type 'Toyota'
    await searchInput.fill('Toyota');
    await page.waitForTimeout(300);

    // Assert Toyota row is visible
    await expect(page.locator('table.koyfin-table')).toContainText('Toyota Motor Corporation');
    await expect(page.locator('table.koyfin-table')).toContainText('7203.T');

    // Clear search
    await searchInput.fill('');
  });

  test('Multi-select compare dock enables realistic side-by-side comparison', async ({ page }) => {
    // Select first two companies
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();

    await checkboxes.nth(0).click();
    // Dock appears with 1 company
    await expect(page.locator('text=1 company selected')).toBeVisible();

    await checkboxes.nth(1).click();
    // Dock updates to 2 companies
    await expect(page.locator('text=2 companies ready to compare')).toBeVisible();

    const compareBtn = page.locator('button:has-text("Compare")').last();
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Navigates to /compare
    await expect(page).toHaveURL(new RegExp(`/compare\\?a=.*`));
  });
});
