import { test, expect } from '@playwright/test';

test.describe('Workstream D — Peers and Compare: Peer-only, CFO aligned, Currency Safe', () => {
  test('Company page contains "Compare with peers →" button opening compare page', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });

    const compareBtn = page.locator('button:has-text("Compare with peers →")');
    await expect(compareBtn).toBeVisible({ timeout: 15000 });
    await compareBtn.click();

    await expect(page).toHaveURL(/.*\/compare\?a=TCS\.NS/);
    await expect(page.locator('h1')).toContainText('Peer Comparison Workbench');
  });

  test('Valid Peers (TCS.NS vs INFY.NS): Compares multiples, CFO by fiscal year, and scale', async ({ page }) => {
    await page.goto('/compare?a=TCS.NS&b=INFY.NS', { waitUntil: 'domcontentloaded' });

    // Assert Both Company Names visible
    await expect(page.locator('h2:has-text("Tata Consultancy Services")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2:has-text("Infosys")')).toBeVisible();

    // Assert Valuation Multiples Table
    await expect(page.locator('h3:has-text("Valuation Multiples")')).toBeVisible();
    await expect(page.locator('td:has-text("P/E Ratio (TTM)")')).toBeVisible();

    // Assert Cash Flow from Operations (CFO) alignment section
    await expect(page.locator('h3:has-text("Cash Flow from Operations (CFO) Alignment")')).toBeVisible();
    await expect(page.locator('button:has-text("FY2024")').first()).toBeVisible();

    // Currency selector toggles USD/INR/EUR/GBP
    const inrBtn = page.locator('button:has-text("INR")').first();
    await inrBtn.click();
    await expect(page.locator('text=Market Cap (INR)').first()).toBeVisible();

    // No Industry mismatch notice should appear for TCS vs INFY
    await expect(page.locator('text=Industry Mismatch Notice')).not.toBeVisible();
  });

  test('Cross-Currency & Fiscal Year Mismatch (TCS.NS vs AAPL): Shows warning and FX conversion', async ({ page }) => {
    await page.goto('/compare?a=TCS.NS&b=AAPL', { waitUntil: 'domcontentloaded' });

    // Assert Fiscal Year Mismatch Warning
    const warning = page.locator('text=Fiscal year end mismatch');
    await expect(warning).toBeVisible({ timeout: 15000 });
    await expect(warning).toContainText('reports in');

    // Assert Normalized FX Rate attribution
    await expect(page.locator('text=Normalized FX:')).toBeVisible();
  });

  test('NOT_A_PEER Banner (TCS.NS vs M&M.NS): Shows industry mismatch notice and allow compare anyway', async ({ page }) => {
    await page.goto('/compare?a=TCS.NS&b=M%26M.NS', { waitUntil: 'domcontentloaded' });

    // Assert Industry Mismatch Notice banner is displayed
    const mismatchBanner = page.locator('text=Industry Mismatch Notice');
    await expect(mismatchBanner).toBeVisible({ timeout: 15000 });

    const bannerDesc = page.locator('text=operate in different industries');
    await expect(bannerDesc).toBeVisible();

    // Assert "Compare anyway with normalised metrics" button exists
    const compareAnywayBtn = page.locator('button:has-text("Compare anyway with normalised metrics")');
    await expect(compareAnywayBtn).toBeVisible();

    // Click "Compare anyway" dismisses the warning
    await compareAnywayBtn.click();
    await expect(mismatchBanner).not.toBeVisible();
  });
});
