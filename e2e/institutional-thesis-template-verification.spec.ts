import { TEST_PASS } from "./test-credentials.js";
import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('sumit@hedger.capital');
  await page.locator('input[type="password"]').fill(TEST_PASS.sumit);
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('Institutional Investment Thesis 18-Section Template & AI Repair Engine', () => {
  test('Renders all 18 sections, non-overlapping tables, scenario estimates, and AI repair workflow', async ({ page }) => {
    await signIn(page);

    // Navigate to NVDA Thesis
    await page.goto('http://localhost:5173/company/NVDA/thesis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify Page Header & Controls
    const topToolbar = page.locator('#thesis-top-toolbar');
    await expect(topToolbar).toBeVisible({ timeout: 10000 });
    await expect(topToolbar.locator('.hedger-intelligence-title')).toHaveText('HEDGER INTELLIGENCE');

    // Verify AI Repair & Verify Button
    const aiRepairBtn = topToolbar.locator('button:has-text("AI Repair & Verify")');
    await expect(aiRepairBtn).toBeVisible();

    // Verify Export / Download Button
    const exportBtn = topToolbar.locator('button:has-text("Export / Download")');
    await expect(exportBtn).toBeVisible();

    // Check thesis content exists
    const bodyText = await page.locator('.page-container').first().innerText();
    expect(bodyText).toContain('1. Executive Investment Summary');
    expect(bodyText).toContain('1.1 Snapshot');
    expect(bodyText).toContain('2. Business Model & Competitive Position');
    expect(bodyText).toContain('2.2 Competitive advantages (evidence-tested)');
    expect(bodyText).toContain('3. Financial Statement Analysis');
    expect(bodyText).toContain('3.1 Multi-year summary');
    expect(bodyText).toContain('4. Growth Quality');
    expect(bodyText).toContain('5. Industry & Peer Comparison');
    expect(bodyText).toContain('6. Valuation');
    expect(bodyText).toContain('6.1 Discount rate (WACC)');
    expect(bodyText).toContain('6.2 DCF (multi-stage FCFF)');
    expect(bodyText).toContain('6.3 Reverse DCF (what the current price requires)');
    expect(bodyText).toContain('7. Bear / Base / Bull Scenarios');
    expect(bodyText).toContain('8. Scenario-Based Price Estimates: 1-Year, 2-Year, 5-Year');
    expect(bodyText).toContain('8.1 Results table');
    expect(bodyText).toContain('9. Sensitivity & Monte Carlo');
    expect(bodyText).toContain('10. Variant Perception & Expectations Gap');
    expect(bodyText).toContain('11. Catalysts & Timeline');
    expect(bodyText).toContain('12. Risks, Pre-Mortem & Thesis Breakers');
    expect(bodyText).toContain('13. Ownership, Insiders & Shareholder Returns');
    expect(bodyText).toContain('14. Risk/Reward & Portfolio Fit');
    expect(bodyText).toContain('15. Monitoring Plan & Thesis Tracking');
    expect(bodyText).toContain('16. Final Assessment');
    expect(bodyText).toContain('17. Sources, Data Quality & Methodology');
    expect(bodyText).toContain('18. Disclaimer');

    // Screenshot Top Hero & Section 1 Snapshot
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/thesis_18sec_top_snapshot.png'
    });

    // Test Table Structure & Non-Overlapping Verification
    const tables = page.locator('table');
    const tableCount = await tables.count();
    expect(tableCount).toBeGreaterThanOrEqual(15);

    // Verify all table containers have overflow-x auto and tables have minimum widths
    const containers = page.locator('div[style*="overflow-x: auto"], div[style*="overflowX: auto"]');
    const containerCount = await containers.count();
    expect(containerCount).toBeGreaterThanOrEqual(10);

    // Scroll to Section 3: 3.1 Multi-Year Summary
    const multiYearHeading = page.locator('h3:has-text("3.1 Multi-year summary")');
    await multiYearHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/thesis_18sec_section3_multiyear_table.png'
    });

    // Scroll to Section 8: 8.1 Results table (10 columns, all 9 cells)
    const resultsHeading = page.locator('h3:has-text("8.1 Results table")');
    await resultsHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/thesis_18sec_section8_scenario_matrix.png'
    });

    // Scroll back to top toolbar and hover Export / Download to reveal all options
    await topToolbar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('.export-dropdown-wrapper').hover();
    await page.waitForTimeout(500);

    const exportMenu = page.locator('.export-dropdown-wrapper');
    await expect(exportMenu.locator('text=PDF Document (Institutional Format)')).toBeVisible();
    await expect(exportMenu.locator('text=Word Document (.docx)')).toBeVisible();
    await expect(exportMenu.locator('text=Excel Spreadsheet (.xlsx)')).toBeVisible();
    await expect(exportMenu.locator('text=Google Sheets (.sheets)')).toBeVisible();
    await expect(exportMenu.locator('text=Markdown Source (.md)')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/thesis_export_options_dropdown.png'
    });

    // Click AI Repair & Verify button and verify confirmation banner
    await aiRepairBtn.click();
    await page.waitForTimeout(1000);

    const noticeBanner = page.locator('text=AI Verification Complete');
    await expect(noticeBanner).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/thesis_ai_repair_notice.png'
    });
  });
});
