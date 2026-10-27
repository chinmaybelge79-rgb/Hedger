import { test, expect } from '@playwright/test';

test.describe('Platform Services Promise & Institutional SLA Matrix', () => {

  test('Pricing Page displays all promised services and comparison matrix', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto('http://localhost:5173/pricing');
    await page.waitForLoadState('networkidle');

    // 1. Verify Pricing Cards exist
    await expect(page.getByText('Basic', { exact: true })).toBeVisible();
    await expect(page.getByText('Plus', { exact: true })).toBeVisible();
    await expect(page.getByText('Pro', { exact: true })).toBeVisible();
    await expect(page.getByText('Ultra', { exact: true })).toBeVisible();

    // 2. Verify Section Header
    await expect(page.getByText('Institutional Service Commitments')).toBeVisible();
    await expect(page.getByText('Services We Promise to Deliver').first()).toBeVisible();

    // 3. Verify Visual Service Guarantee Cards
    await expect(page.getByText('Global Market Data & Real-Time Streaming').first()).toBeVisible();
    await expect(page.getByText('Deterministic Valuation Engines & Sensitivity').first()).toBeVisible();
    await expect(page.getByText('Cross-Border Peer Benchmarking & Normalization').first()).toBeVisible();
    await expect(page.getByText('Specialized Multi-Model Financial Architecture').first()).toBeVisible();
    await expect(page.getByText('Hedger AI Investment Theses & Report Downloads').first()).toBeVisible();
    await expect(page.getByText('Predictive Simulation & Risk Stress Testing').first()).toBeVisible();

    // 4. Verify Full Comparison Matrix
    await expect(page.getByText('Full Service & Capability Comparison Matrix').first()).toBeVisible();
    await expect(page.getByText('Market Data & Global Discovery').first()).toBeVisible();
    await expect(page.getByText('Valuation Engines & Sensitivity').first()).toBeVisible();
    await expect(page.getByText('Hedger AI Intelligence & Theses').first()).toBeVisible();
    await expect(page.getByText('Cross-Border Benchmarking & Risk').first()).toBeVisible();

    // 5. Verify SLA guarantees
    await expect(page.getByText('99.9% Valuation Engine Uptime').first()).toBeVisible();
    await expect(page.getByText('Zero Synthetic Figure Drift').first()).toBeVisible();
    await expect(page.getByText('AES-256 Encrypted Model State').first()).toBeVisible();

    // Scroll to the promised services section and take screenshot
    const promiseHeading = page.getByText('Services We Promise to Deliver').first();
    await promiseHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/pricing_services_promise_cards.png'
    });

    // Scroll to the comparison table and take screenshot
    const matrixHeading = page.getByText('Full Service & Capability Comparison Matrix').first();
    await matrixHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/pricing_services_comparison_matrix.png'
    });
  });

  test('Landing Page pricing teaser navigates directly to Pricing Services Promise', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Verify pricing teaser button navigates to /pricing
    const viewPricingBtn = page.getByText('View All Membership Tiers →');
    await viewPricingBtn.scrollIntoViewIfNeeded();
    await expect(viewPricingBtn).toBeVisible();
    await viewPricingBtn.click();

    await page.waitForURL('**/pricing');
    await expect(page.getByText('Services We Promise to Deliver').first()).toBeVisible();
  });
});
