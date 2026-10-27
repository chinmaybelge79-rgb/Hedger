import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill('Chinusha4love$$');
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('Original SVG Company Logos from 21st.dev / Vector Registry', () => {
  test('Verify Apple, Microsoft, NVIDIA, and TCS dossier headers with authentic colored SVGs', async ({ page }) => {
    await signIn(page);

    // 1. Apple Dossier Header
    await page.goto('http://localhost:5173/company/AAPL');
    await page.waitForLoadState('networkidle');
    const appleLogo = page.locator('.company-logo-container svg').first();
    await expect(appleLogo).toBeVisible();

    // Screenshot Apple header
    const dossierHeader = page.locator('.page-container > div').first();
    await dossierHeader.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_dossier_aapl_dark.png'
    });

    // Light mode Apple header
    await page.evaluate(() => {
      localStorage.setItem('hedger-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.page-container > div').first().screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_dossier_aapl_light.png'
    });

    // Switch back to dark mode
    await page.evaluate(() => {
      localStorage.setItem('hedger-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 2. NVIDIA Dossier Header (Vibrant Green Claw)
    await page.goto('http://localhost:5173/company/NVDA');
    await page.waitForLoadState('networkidle');
    await page.locator('.page-container > div').first().screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_dossier_nvda.png'
    });

    // 3. Microsoft Dossier Header (4-Color Grid)
    await page.goto('http://localhost:5173/company/MSFT');
    await page.waitForLoadState('networkidle');
    await page.locator('.page-container > div').first().screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_dossier_msft.png'
    });

    // 4. TCS Dossier Header (Tata Consultancy Services)
    await page.goto('http://localhost:5173/company/TCS.NS');
    await page.waitForLoadState('networkidle');
    await page.locator('.page-container > div').first().screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_dossier_tcs.png'
    });
  });

  test('Verify Markets Page Top Gainers & Losers with aligned company logos', async ({ page }) => {
    await signIn(page);
    await page.goto('http://localhost:5173/markets');
    await page.waitForLoadState('networkidle');

    // Screenshot Gainers & Losers section
    const gainersLosers = page.locator('text=Top Gainers').first().locator('xpath=ancestor::div[contains(@class, "card")]');
    await expect(gainersLosers).toBeVisible();
    await gainersLosers.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_markets_gainers.png'
    });
  });

  test('Verify Screener Page table rows with aligned company logos', async ({ page }) => {
    await signIn(page);
    await page.goto('http://localhost:5173/screener');
    await page.waitForLoadState('networkidle');

    const screenerTable = page.locator('table').first();
    await expect(screenerTable).toBeVisible();
    await screenerTable.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_screener_table.png'
    });
  });

  test('Verify Spotlight Search with authentic company logos', async ({ page }) => {
    await signIn(page);
    await page.goto('http://localhost:5173/markets');
    await page.waitForLoadState('networkidle');

    // Click search bar to open modal
    await page.locator('.nav-search-bar').click();
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Apple');
    await page.waitForTimeout(300);

    const searchDialog = page.locator('div[role="dialog"]');
    await expect(searchDialog).toBeVisible();
    await searchDialog.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_search_modal_apple.png'
    });
  });

  test('Verify Landing Page and Compare Page with authentic company logos', async ({ page }) => {
    await signIn(page);

    // Landing Page Quick Tickers & Showcase
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const showcaseCard = page.locator('text=Interactive Terminal Showcase').locator('xpath=ancestor::div[contains(@style, "border") and contains(@style, "radius")]').first();
    await showcaseCard.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_landing_showcase.png'
    });

    // Compare Page (AAPL vs MSFT)
    await page.goto('http://localhost:5173/compare?a=AAPL&b=MSFT');
    await page.waitForLoadState('networkidle');
    const compareCards = page.locator('text=Target Instrument').locator('xpath=ancestor::div[contains(@style, "grid")]').first();
    await compareCards.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/logo_compare_aapl_msft.png'
    });
  });
});
