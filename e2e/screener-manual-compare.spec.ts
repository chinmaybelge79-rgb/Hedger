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

test.describe('Screener Manual Search & Same-Currency Comparison Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('Manual search allows adding companies and strictly enforces same-currency comparison', async ({ page }) => {
    // 1. Navigate to Screener with All Markets
    await page.goto('http://localhost:5173/screener?region=all');
    await page.waitForLoadState('networkidle');

    // 2. Locate "+ Add to Compare" button and open popover
    const addCompareBtn = page.locator('[data-testid="screener-manual-compare-btn"]');
    await expect(addCompareBtn).toBeVisible();
    await addCompareBtn.click();

    // 3. Verify the manual compare popover opened
    const popover = page.locator('[data-testid="screener-manual-compare-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover.getByText('Search Company to Compare')).toBeVisible();

    // 4. Search for "AAPL" in the manual compare search input
    const searchInput = page.locator('[data-testid="manual-compare-search-input"]');
    await searchInput.fill('AAPL');
    await page.waitForTimeout(400);

    // 5. Click "+ Compare" on AAPL
    const addAaplBtn = page.locator('[data-testid="add-compare-item-AAPL"]');
    await expect(addAaplBtn).toBeVisible();
    await addAaplBtn.click();

    // 6. Verify floating compare bar appears and shows base currency USD
    const floatingBar = page.locator('[data-testid="screener-floating-compare-bar"]');
    await expect(floatingBar).toBeVisible();
    await expect(floatingBar.getByText('AAPL', { exact: true })).toBeVisible();
    await expect(floatingBar.getByText('Same Currency: USD')).toBeVisible();

    // 7. Re-open manual compare popover to search for a different currency company (e.g. RELIANCE in INR)
    if (!(await popover.isVisible())) {
      await addCompareBtn.click();
    }
    await searchInput.fill('RELIANCE');
    await page.waitForTimeout(500);

    // Verify row for RELIANCE.NS shows currency mismatch indicator
    const relianceRow = page.locator('[data-testid="manual-compare-row-RELIANCE.NS"]');
    await expect(relianceRow).toBeVisible();
    await expect(relianceRow.getByText('INR != USD')).toBeVisible();

    // Clicking the mismatched button triggers the currency restriction notification
    await relianceRow.getByText('INR != USD').click();

    // Verify notification banner appears
    const noticeBanner = page.locator('[data-testid="compare-currency-notice"]');
    await expect(noticeBanner).toBeVisible();
    await expect(noticeBanner).toContainText('Comparison restricted: Companies can only be compared to same currency companies only (USD)');
    await expect(noticeBanner).toContainText('RELIANCE.NS is denominated in INR');

    // Take screenshot of currency mismatch restriction in manual search
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/screener_manual_compare_currency_restriction.png'
    });

    // 8. Now search for another USD company (e.g. MSFT)
    await searchInput.fill('MSFT');
    await page.waitForTimeout(400);

    const addMsftBtn = page.locator('[data-testid="add-compare-item-MSFT"]');
    await expect(addMsftBtn).toBeVisible();
    await addMsftBtn.click();

    // 9. Verify floating bar now has both companies and ready to compare
    await expect(floatingBar.getByText('2 companies ready to compare')).toBeVisible();
    await expect(floatingBar.getByText('AAPL', { exact: true })).toBeVisible();
    await expect(floatingBar.getByText('MSFT', { exact: true })).toBeVisible();

    const launchBtn = page.locator('[data-testid="launch-compare-btn"]');
    await expect(launchBtn).toBeVisible();
    await expect(launchBtn).toHaveText('Compare AAPL vs MSFT →');

    // Take screenshot of successful 2-company same-currency comparison ready
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/screener_manual_compare_success_usd.png'
    });

    // 10. Test clicking Launch Compare navigates to compare page
    await launchBtn.click();
    await page.waitForURL('**/compare?a=AAPL&b=MSFT', { timeout: 10000 });
    await expect(page).toHaveURL(/.*compare\?a=AAPL&b=MSFT/);
  });

  test('Table row checkboxes enforce same currency restriction when base currency is active', async ({ page }) => {
    // 1. Navigate to Screener with All Markets
    await page.goto('http://localhost:5173/screener?region=all');
    await page.waitForLoadState('networkidle');

    // 2. Select first USD company in the table (AAPL)
    const aaplCheckbox = page.locator('[data-testid="screener-row-compare-checkbox-AAPL"]');
    await expect(aaplCheckbox).toBeVisible();
    await aaplCheckbox.click();

    // 3. Verify floating bar displays active base currency USD
    const floatingBar = page.locator('[data-testid="screener-floating-compare-bar"]');
    await expect(floatingBar).toBeVisible();
    await expect(floatingBar.getByText('Same Currency: USD')).toBeVisible();

    // 4. On page 1, 0700.HK is present and is in HKD
    const hkCheckbox = page.locator('[data-testid="screener-row-compare-checkbox-0700.HK"]');
    await expect(hkCheckbox).toBeVisible();
    await expect(hkCheckbox).toBeDisabled();

    // 5. Clicking on the row or checkbox triggers the currency notice
    const hkCell = page.locator('[data-testid="screener-row-compare-cell-0700.HK"]');
    await hkCell.click();
    const noticeBanner = page.locator('[data-testid="compare-currency-notice"]');
    await expect(noticeBanner).toBeVisible();
    await expect(noticeBanner).toContainText('Companies can only be compared to same currency companies only (USD)');
    await expect(noticeBanner).toContainText('0700.HK is denominated in HKD');

    // 6. Check a USD company (MSFT)
    const msftCheckbox = page.locator('[data-testid="screener-row-compare-checkbox-MSFT"]');
    await expect(msftCheckbox).toBeVisible();
    await expect(msftCheckbox).toBeEnabled();
    await msftCheckbox.click();

    // 7. Verify 2 companies selected
    await expect(floatingBar.getByText('2 companies ready to compare')).toBeVisible();
  });

  test('INR base currency restricts comparison to INR companies only and blocks USD', async ({ page }) => {
    // 1. Navigate to Screener with India Market
    await page.goto('http://localhost:5173/screener?region=india');
    await page.waitForLoadState('networkidle');

    // 2. Add RELIANCE.NS from table
    const relianceCheckbox = page.locator('[data-testid="screener-row-compare-checkbox-RELIANCE.NS"]');
    await expect(relianceCheckbox).toBeVisible();
    await relianceCheckbox.click();

    // 3. Verify floating bar displays active base currency INR
    const floatingBar = page.locator('[data-testid="screener-floating-compare-bar"]');
    await expect(floatingBar).toBeVisible();
    await expect(floatingBar.getByText('Same Currency: INR')).toBeVisible();

    // 4. Open manual compare search and search for AAPL (USD)
    const addCompareBtn = page.locator('[data-testid="screener-manual-compare-btn"]');
    await addCompareBtn.click();

    const searchInput = page.locator('[data-testid="manual-compare-search-input"]');
    await searchInput.fill('AAPL');
    await page.waitForTimeout(400);

    const aaplRow = page.locator('[data-testid="manual-compare-row-AAPL"]');
    await expect(aaplRow).toBeVisible();
    await expect(aaplRow.getByText('USD != INR')).toBeVisible();

    // Clicking USD company button triggers restriction notice
    await aaplRow.getByText('USD != INR').click();
    const noticeBanner = page.locator('[data-testid="compare-currency-notice"]');
    await expect(noticeBanner).toBeVisible();
    await expect(noticeBanner).toContainText('Comparison restricted: Companies can only be compared to same currency companies only (INR)');

    // 5. Search for TCS (INR) and add it
    await searchInput.fill('TCS');
    await page.waitForTimeout(400);

    const addTcsBtn = page.locator('[data-testid="add-compare-item-TCS.NS"]');
    await expect(addTcsBtn).toBeVisible();
    await addTcsBtn.click();

    // 6. Verify ready to compare both INR companies
    await expect(floatingBar.getByText('2 companies ready to compare')).toBeVisible();
    await expect(floatingBar.getByText('RELIANCE.NS', { exact: true })).toBeVisible();
    await expect(floatingBar.getByText('TCS.NS', { exact: true })).toBeVisible();

    // Take screenshot of successful INR-to-INR comparison
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/screener_manual_compare_inr_pair.png'
    });
  });
});
