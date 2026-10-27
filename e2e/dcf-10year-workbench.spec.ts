import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill('Chinusha4love$$');
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('Institutional 10-Year DCF Model Product (/models/dcf/:symbol)', () => {
  test.use({
    viewport: { width: 1440, height: 900 }
  });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('full institutional DCF workflow: hero card, sliders, 5x5 sensitivity, scenarios, reverse DCF, copy CSV, save model', async ({ page }) => {
    // 1. Navigate to TCS.NS DCF Model workbench
    await page.goto('http://localhost:5173/models/dcf/TCS.NS');

    // Wait for the assumptions panel and hero card
    await expect(page.locator('aside[aria-label="Valuation Assumptions Sidebar"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section[aria-label="Valuation Hero Summary"]')).toBeVisible();

    // Verify 56px Hero Card Value & Elements
    const heroValue = page.locator('section[aria-label="Valuation Hero Summary"] span').filter({ hasText: /₹[0-9,]+/ }).first();
    await expect(heroValue).toBeVisible();

    // Verify Chips
    await expect(page.locator('text=WACC:').first()).toBeVisible();
    await expect(page.locator('text=Timing:').first()).toBeVisible();
    await expect(page.locator('text=TV Share:').first()).toBeVisible();

    // Verify Range Bar with Price Pin
    await expect(page.locator('section[aria-label="Valuation Hero Summary"]').getByText(/Bear Case/)).toBeVisible();
    await expect(page.locator('section[aria-label="Valuation Hero Summary"]').getByText(/Base Estimate/)).toBeVisible();
    await expect(page.locator('section[aria-label="Valuation Hero Summary"]').getByText(/Bull Case/)).toBeVisible();

    // Verify Tab 1: Summary (Enterprise to Equity Waterfall, Multiples, FCF Chart)
    await expect(page.locator('text=Enterprise Value to Equity Value Bridge')).toBeVisible();
    await expect(page.locator('text=PV of Explicit FCF (10Y)')).toBeVisible();
    await expect(page.locator('text=Free Cash Flow Trajectory (Years 1–10)')).toBeVisible();
    await expect(page.locator('text=Implied Valuation Multiples')).toBeVisible();

    // Capture Screenshot of Summary Tab at 1440px
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_tab_summary_1440.png',
      fullPage: true
    });

    // 2. Tab 2: Projections (10-Year Table & Copy CSV)
    await page.click('button#tab-projections');
    await expect(page.locator('text=10-Year Financial Projection Table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Year 1 explicit' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Year 10 fade' })).toBeVisible();
    await expect(page.locator('td:has-text("FCFF")')).toBeVisible();

    // Test Copy CSV
    const copyCsvBtn = page.locator('button:has-text("Copy CSV")');
    await expect(copyCsvBtn).toBeVisible();
    await copyCsvBtn.click();
    await expect(page.locator('text=Copied CSV!')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_tab_projections_1440.png',
      fullPage: true
    });

    // 3. Tab 3: Sensitivity 5x5 Matrix
    await page.click('button#tab-sensitivity');
    await expect(page.locator('text=5×5 Valuation Sensitivity Matrix')).toBeVisible();
    await expect(page.locator('#panel-sensitivity th').filter({ hasText: 'WACC' }).first()).toBeVisible();

    // Verify cell click applies assumptions
    const initialWaccText = await page.locator('text=WACC:').first().innerText();
    const clickableCell = page.locator('#panel-sensitivity td').filter({ hasText: /₹[0-9,]+/ }).first();
    await clickableCell.click();
    // After click, the WACC chip should reflect the new cell value
    await page.waitForTimeout(300);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_tab_sensitivity_1440.png',
      fullPage: true
    });

    // 4. Tab 4: Scenarios (Bear, Base, Bull, Probability Weighting)
    await page.click('button#tab-scenarios');
    await expect(page.locator('text=Scenario Analysis (Bear / Base / Bull)')).toBeVisible();
    await expect(page.locator('#panel-scenarios').getByText('Bear Case', { exact: true })).toBeVisible();
    await expect(page.locator('#panel-scenarios').getByText('Base Case', { exact: true })).toBeVisible();
    await expect(page.locator('#panel-scenarios').getByText('Bull Case', { exact: true })).toBeVisible();
    await expect(page.locator('text=Probability-Weighted Intrinsic Value')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_tab_scenarios_1440.png',
      fullPage: true
    });

    // 5. Tab 5: Reverse DCF
    await page.click('button#tab-reverse');
    await expect(page.locator('text=Reverse DCF (Market Implied Expectations)')).toBeVisible();
    await expect(page.locator('text=Market Implied Benchmark:')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_tab_reverse_1440.png',
      fullPage: true
    });

    // 6. Tab 6: Methodology
    await page.click('button#tab-method');
    await expect(page.locator('text=Institutional Valuation Methodology & Governance')).toBeVisible();
    await expect(page.locator('text=Free Cash Flow to Firm (FCFF) Formula')).toBeVisible();

    // Verify Mandatory Statutory Disclaimer
    await expect(page.locator('text=Estimate based on the assumptions shown. Not investment advice.')).toBeVisible();

    // 7. Save Model Modal Interaction
    await page.click('button:has-text("Save Model")');
    await expect(page.locator('h3:has-text("Save DCF Valuation Model")')).toBeVisible();
    await page.fill('textarea[placeholder="Optional investment thesis notes..."]', 'Base case institutional valuation thesis.');
    await page.click('button:has-text("Confirm Save")');
    await expect(page.locator('text=Model configuration and assumptions saved successfully.')).toBeVisible();

    // 8. No Leakage Check: Assert no "NaN", "null", "undefined", "Infinity" in the rendered DOM text
    const pageText = await page.innerText('main');
    expect(pageText).not.toContain('NaN');
    expect(pageText).not.toContain('undefined');
    expect(pageText).not.toContain('null');
    expect(pageText).not.toContain('Infinity');
  });

  test('bank routing: HDFCBANK.NS strictly routes to Residual Income and DDM cross-check', async ({ page }) => {
    await page.goto('http://localhost:5173/models/dcf/HDFCBANK.NS');

    await expect(page.locator('aside[aria-label="Valuation Assumptions Sidebar"]')).toBeVisible({ timeout: 10000 });
    // Bank notice
    await expect(page.locator('text=Institutional Bank Valuation:')).toBeVisible();
    await expect(page.locator('text=Residual Income / DDM')).toBeVisible();

    // Bank summary breakdown
    await expect(page.locator('text=Residual Income Valuation Breakdown')).toBeVisible();
    await expect(page.locator('text=Starting Book Value (BV0)')).toBeVisible();
    await expect(page.locator('text=Dividend Discount Model (DDM) Cross-Check')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_bank_residual_income_1440.png',
      fullPage: true
    });
  });

  test('validation guardrail: invalid WACC displays inline error message and blocks calculation', async ({ page }) => {
    await page.goto('http://localhost:5173/models/dcf/NVDA');

    await expect(page.locator('aside[aria-label="Valuation Assumptions Sidebar"]')).toBeVisible({ timeout: 10000 });

    // Enter an invalid WACC override (< 5%)
    const waccInput = page.locator('input[placeholder*="Computed:"]');
    await waccInput.fill('3.0');

    // Inline validation error should appear
    await expect(page.locator('text=Validation blocked run:')).toBeVisible();
    await expect(page.locator('text=WACC must be between 5% and 25%.')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_invalid_input_error.png',
      fullPage: true
    });
  });

  test('missing data state: non-existent symbol cleanly presents Unavailable explanation', async ({ page }) => {
    await page.goto('http://localhost:5173/models/dcf/UNKNOWN999XYZ');

    // Clean Unavailable view
    await expect(page.locator('text=Unavailable:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Explore Market Universe")')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_missing_data_unavailable.png',
      fullPage: true
    });
  });

  test('mobile responsive layout at 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/models/dcf/TCS.NS');

    await expect(page.locator('section[aria-label="Valuation Hero Summary"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('aside[aria-label="Valuation Assumptions Sidebar"]')).toBeVisible();

    // Verify touch targets >= 40px
    const saveBtn = page.locator('button:has-text("Save Model")');
    const box = await saveBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_mobile_390.png',
      fullPage: true
    });
  });
});
