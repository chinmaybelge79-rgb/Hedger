import { test, expect } from '@playwright/test';

test.describe('Markets Section — Real-Time Multi-Region & Native Chart Engine', () => {
  test('India (default) displays real indices, market breadth, and native Canvas 2D chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Assert Header & Region Tab
    await expect(page.locator('h1')).toContainText('Markets');
    await expect(page.locator('button:has-text("India")')).toBeVisible();

    // Assert Indian benchmark indices are visible with live prices
    await expect(page.getByText('NIFTY 50', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('SENSEX', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('NIFTY Bank', { exact: true })).toBeVisible({ timeout: 15000 });

    // Assert Native Canvas 2D chart is rendered for NIFTY 50
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toBeVisible();
    await expect(chartCard).toContainText('NIFTY 50');
    await expect(chartCard).toContainText('NATIVE CANVAS 2D');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Assert Market Breadth & Sectors
    await expect(page.locator('text=Market breadth (India)')).toBeVisible();
    await expect(page.locator('text=Advance/decline ratio')).toBeVisible();
    await expect(page.locator('text=Sectors Performance')).toBeVisible();
  });

  test('Clicking United States switches to US indices, real USD quotes, US movers and S&P 500 chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Click United States Tab
    const usTab = page.locator('button:has-text("United States")');
    await expect(usTab).toBeVisible();
    await usTab.click();

    // Assert US Indices are displayed
    await expect(page.getByText('S&P 500', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('NASDAQ Composite', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Dow Jones', { exact: true })).toBeVisible({ timeout: 15000 });

    // Assert Chart updates to S&P 500
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('S&P 500');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Assert US Breadth & Top Gainers
    await expect(page.locator('text=Market breadth (United States)')).toBeVisible();
    await expect(page.locator('text=Top Gainers (United States)')).toBeVisible();
  });

  test('Clicking China switches to Chinese & HK indices, HKD/CNY currencies, Chinese movers and Hang Seng chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Click China Tab
    const chinaTab = page.locator('button:has-text("China")');
    await expect(chinaTab).toBeVisible();
    await chinaTab.click();

    // Assert Chinese Indices are displayed
    await expect(page.getByText('Hang Seng Index', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('SSE Composite', { exact: true })).toBeVisible({ timeout: 15000 });

    // Assert Chart updates to Hang Seng Index
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('Hang Seng');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Assert Chinese Breadth & Top Gainers
    await expect(page.locator('text=Market breadth (China)')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Top Gainers (China)')).toBeVisible({ timeout: 15000 });
  });

  test('Clicking Commodities switches to Gold, Oil, Silver with Canvas 2D chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Click Commodities Tab
    const commTab = page.locator('button:has-text("Commodities")');
    await expect(commTab).toBeVisible();
    await commTab.click();

    // Assert Commodities are displayed
    await expect(page.getByText('Gold Dec 26', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Crude Oil (WTI)', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Silver', { exact: true })).toBeVisible({ timeout: 15000 });

    // Assert Chart updates to Gold
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('Gold');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('Clicking an index card switches the active chart to that specific index', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // On India, click SENSEX
    const sensexCard = page.locator('.card:has-text("SENSEX")').first();
    await expect(sensexCard).toBeVisible({ timeout: 15000 });
    await sensexCard.click();

    // Assert Chart now displays SENSEX Performance
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('SENSEX Performance');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('Clicking Europe switches to European indices, EUR/GBP quotes, and FTSE 100 chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Click Europe Tab
    const europeTab = page.locator('button:has-text("Europe")');
    await expect(europeTab).toBeVisible();
    await europeTab.click();

    // Assert European indices
    await expect(page.getByText('FTSE 100', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('DAX 40', { exact: true })).toBeVisible({ timeout: 15000 });

    // Assert Chart updates to FTSE
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('FTSE 100');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('Clicking ALL timeframe button successfully loads all-time chart without fallback error', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Wait for canvas to be visible
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Click 'ALL' period button inside HedgerChart
    const allBtn = chartCard.locator('button:has-text("ALL")');
    await expect(allBtn).toBeVisible();
    await allBtn.click();

    // Assert Canvas remains visible and error state is NOT shown
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(chartCard).not.toContainText('currently updating for');
  });

  test('Switching to Commodities and clicking ALL renders complete historical Gold chart', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Click Commodities
    const commTab = page.locator('button:has-text("Commodities")');
    await commTab.click();

    // Assert Gold is selected
    const chartCard = page.locator('#market-performance-chart');
    await expect(chartCard).toContainText('Gold', { timeout: 15000 });
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Click ALL button
    const allBtn = chartCard.locator('button:has-text("ALL")');
    await expect(allBtn).toBeVisible();
    await allBtn.click();

    // Canvas must remain rendered with all-time bars without error fallback
    await expect(chartCard.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(chartCard).not.toContainText('currently updating for GC=F');
  });
});
