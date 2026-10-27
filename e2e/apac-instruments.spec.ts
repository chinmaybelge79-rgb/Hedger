import { test, expect } from '@playwright/test';

test.describe('Asia-Pacific Equities (7203.T, 9984.T, 9988.HK) & Visual Validation', () => {
  test('1. Landing page hero merges with WebGL background without border box', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Confirm headline is visible
    const headline = page.locator('h1:has-text("Institutional-grade equity research in your hands")');
    await expect(headline).toBeVisible();

    // Verify dark mode default
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Capture visual confirmation screenshot
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/landing_borderless_hero_dark.png',
      fullPage: false
    });
  });

  test('2. Search modal names and matches 7203.T, 9984.T, 9988.HK by ticker and corporate name', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Open search modal via spotlight search button or shortcut
    const searchBtn = page.locator('button:has-text("Search 15,000+")');
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const searchInput = page.locator('[role="dialog"] input');
    await expect(searchInput).toBeVisible();

    // Search 'toyota'
    await searchInput.fill('toyota');
    await page.waitForTimeout(300);
    const toyotaItem = page.locator('[role="dialog"]').locator('text=Toyota Motor Corporation').first();
    await expect(toyotaItem).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=7203.T').first()).toBeVisible();

    // Search '7203'
    await searchInput.fill('7203');
    await page.waitForTimeout(300);
    await expect(page.locator('[role="dialog"]').locator('text=Toyota Motor Corporation').first()).toBeVisible();

    // Search 'softbank'
    await searchInput.fill('softbank');
    await page.waitForTimeout(300);
    await expect(page.locator('[role="dialog"]').locator('text=SoftBank Group Corp.').first()).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=9984.T').first()).toBeVisible();

    // Search 'alibaba'
    await searchInput.fill('alibaba');
    await page.waitForTimeout(300);
    await expect(page.locator('[role="dialog"]').locator('text=Alibaba Group Holding Limited').first()).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=9988.HK').first()).toBeVisible();

    // Capture screenshot of search modal with Alibaba match
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/search_modal_apac_match.png'
    });
  });

  test('3. DCF Model Workbench for 7203.T displays Image 5-styled Price Scenarios estimation bar', async ({ page }) => {
    await page.goto('http://localhost:5173/models/dcf/7203.T');
    await page.waitForLoadState('domcontentloaded');

    // Wait for DCF Workbench card to load
    await expect(page.locator('h1:has-text("Toyota Motor Corporation (7203.T)")')).toBeVisible({ timeout: 15000 });

    // Price Scenarios Card (matching user reference Image 5)
    const scenariosTitle = page.locator('text=Price Scenarios').first();
    await expect(scenariosTitle).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Bull Case').first()).toBeVisible();
    await expect(page.locator('text=Bear Case').first()).toBeVisible();
    await expect(page.locator('text=Base Estimate').first()).toBeVisible();

    // Current Price floating badge
    await expect(page.locator('text=Current Price:').first()).toBeVisible();

    // Capture screenshot of Price Scenarios component
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_7203_price_scenarios_bar.png'
    });
  });

  test('4. Models Directory displays visual formulas and variable definition glossary', async ({ page }) => {
    await page.goto('http://localhost:5173/models');
    await page.waitForLoadState('domcontentloaded');

    // Confirm heading
    await expect(page.locator('h1:has-text("Valuation Models & Computational Engines")')).toBeVisible();

    // Confirm buttons are generic 'Inspect [Model]' without company mentions
    await expect(page.locator('text=Inspect DCF Workbench').first()).toBeVisible();
    await expect(page.locator('text=Inspect Bank Model').first()).toBeVisible();
    await expect(page.locator('text=Inspect DDM Cross-Check').first()).toBeVisible();
    await expect(page.locator('text=Inspect EPV Methodology').first()).toBeVisible();

    // Confirm variable definition glossary table
    await expect(page.locator('text=Audited Terms & Variable Definitions').first()).toBeVisible();
    await expect(page.locator('text=Free Cash Flow to Firm (Year t)').first()).toBeVisible();

    // Capture screenshot of formulas and glossary
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/models_formulas_and_glossary.png'
    });
  });

  test('5. Company dossiers for 7203.T and 9988.HK render cleanly in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/company/7203.T');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1:has-text("Toyota Motor Corporation")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=7203.T · TSE · JPY')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/toyota_company_page.png'
    });

    await page.goto('http://localhost:5173/company/9988.HK');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Alibaba Group Holding")')).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/alibaba_company_page.png'
    });
  });

  test('6. Footer links navigate directly to endpoints: /pricing, /models, /provenance, /api-docs, /terms', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Data Provenance
    const provenanceLink = page.locator('footer a:has-text("Data Provenance")');
    await expect(provenanceLink).toBeVisible();
    await provenanceLink.click();
    await expect(page).toHaveURL(/.*\/provenance/);
    await expect(page.locator('h1:has-text("Audited Data Provenance & Methodology")')).toBeVisible();

    // 2. API Documentation
    const apiDocsLink = page.locator('footer a:has-text("API Documentation")');
    await expect(apiDocsLink).toBeVisible();
    await apiDocsLink.click();
    await expect(page).toHaveURL(/.*\/api-docs/);
    await expect(page.locator('h1:has-text("Institutional REST API")')).toBeVisible();

    // 3. Terms & Privacy
    const termsLink = page.locator('footer a:has-text("Terms & Privacy")');
    await expect(termsLink).toBeVisible();
    await termsLink.click();
    await expect(page).toHaveURL(/.*\/terms/);
    await expect(page.locator('h1:has-text("Terms of Service & Regulatory Disclaimers")')).toBeVisible();

    // 4. Methodology
    const methodologyLink = page.locator('footer a:has-text("Methodology")');
    await expect(methodologyLink).toBeVisible();
    await methodologyLink.click();
    await expect(page).toHaveURL(/.*\/models/);
    await expect(page.locator('h1:has-text("Valuation Models & Computational Engines")')).toBeVisible();

    // 5. Pricing
    const pricingLink = page.locator('footer a:has-text("Pricing")');
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/.*\/pricing/);
    await expect(page.locator('text=Institutional-Grade Equity Research in Your Hands')).toBeVisible();
  });
});
