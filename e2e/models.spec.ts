import { test, expect } from '@playwright/test';

test.describe('Workstream E — Valuation Models: Bottom Section & Model Workbench', () => {
  test('Standard company (TCS.NS) displays 3 standard models and NO banking models', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });

    // Assert "Valuation models" section exists
    const section = page.locator('#valuation-models-section');
    await expect(section).toBeVisible({ timeout: 15000 });

    // Assert 3 Standard Models exist
    await expect(section.locator('h3:has-text("Discounted Cash Flow")')).toBeVisible();
    await expect(section.locator('h3:has-text("Reverse DCF")')).toBeVisible();
    await expect(section.locator('h3:has-text("Relative Valuation")')).toBeVisible();

    // Assert Banking models DO NOT appear
    await expect(section.locator('text=Excess Returns Model')).not.toBeVisible();
    await expect(section.locator('text=Dividend Discount (DDM)')).not.toBeVisible();
  });

  test('Banking entity (HDFCBANK.NS) displays 3 financial models and industrial DCF absence notice', async ({ page }) => {
    await page.goto('/company/HDFCBANK.NS', { waitUntil: 'domcontentloaded' });

    const section = page.locator('#valuation-models-section');
    await expect(section).toBeVisible({ timeout: 15000 });

    // Assert Industrial DCF absence advisory notice is visible
    await expect(section.locator('text=Notice on Industrial DCF')).toBeVisible();
    await expect(section.locator('text=Free Cash Flow to Firm (FCFF)')).toBeVisible();

    // Assert 3 Banking models exist
    await expect(section.locator('h3:has-text("Excess Returns Model")')).toBeVisible();
    await expect(section.locator('h3:has-text("Dividend Discount (DDM)")')).toBeVisible();
    await expect(section.locator('h3:has-text("Price to Tangible Book")')).toBeVisible();
  });

  test('Clicking "Open full model →" navigates to /models/:model/:symbol workbench with audit trail', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });

    const openBtn = page.locator('#valuation-models-section button:has-text("Open full model →")').first();
    await expect(openBtn).toBeVisible({ timeout: 15000 });
    await openBtn.click();

    // Assert URL matches /models/dcf/TCS.NS
    await expect(page).toHaveURL(/.*\/models\/dcf\/TCS\.NS/);

    // Assert Workbench loaded
    await expect(page.locator('h1')).toContainText('Discounted Cash Flow');
    await expect(page.locator('text=TCS.NS').first()).toBeVisible();

    // Assert Parameters & Sliders visible
    await expect(page.locator('h2:has-text("Model Parameters & Inputs")')).toBeVisible();
    await expect(page.locator('text=Weighted Average Cost of Capital (WACC)')).toBeVisible();

    // Adjust WACC slider and verify audit trail records the update
    const waccSlider = page.locator('input[type="range"]').first();
    await waccSlider.evaluate((el: HTMLInputElement) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, '13');
      } else {
        el.value = '13';
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Parameter audit trail should record change
    await expect(page.locator('text=Parameter Audit Trail')).toBeVisible();
    await expect(page.locator('div:has-text("Parameter Audit Trail")').first()).toContainText('WACC');
  });
});
