import { test, expect } from '@playwright/test';

test.describe('Workstream A — Routing: Every stock opens the right company', () => {
  const tenSymbols = [
    { symbol: 'TCS.NS', expectedName: 'Tata Consultancy Services' },
    { symbol: 'INFY.NS', expectedName: 'Infosys' },
    { symbol: 'HDFCBANK.NS', expectedName: 'HDFC Bank' },
    { symbol: 'M&M.NS', expectedName: 'Mahindra & Mahindra' },
    { symbol: 'AAPL', expectedName: 'Apple' },
    { symbol: 'MSFT', expectedName: 'Microsoft' },
    { symbol: 'BRK-B', expectedName: 'Berkshire Hathaway' },
    { symbol: 'SHEL.L', expectedName: 'Shell' },
    { symbol: '7203.T', expectedName: 'Toyota' },
    { symbol: 'RELIANCE.NS', expectedName: 'Reliance Industries' }
  ];

  test('Sequential walk through 10 symbols isolates company name, price, and route', async ({ page }) => {
    let previousPrice = '';

    for (const item of tenSymbols) {
      // Listen for overview request
      const overviewPromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/instruments/${encodeURIComponent(item.symbol)}/overview`) &&
          res.status() === 200,
        { timeout: 15000 }
      );

      await page.goto(`/company/${encodeURIComponent(item.symbol)}`, { waitUntil: 'domcontentloaded' });
      await overviewPromise;

      // 1. Assert URL contains the encoded symbol
      expect(page.url()).toContain(`/company/${encodeURIComponent(item.symbol)}`);

      // 2. Assert page heading matches the company name
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      const headingText = await heading.textContent();
      expect(headingText).toContain(item.expectedName);

      // If not Reliance, heading must never mention Reliance
      if (item.symbol !== 'RELIANCE.NS') {
        expect(headingText).not.toContain('Reliance');
      }

      // 3. Assert ticker line contains the symbol
      const tickerLine = page.locator('text=' + item.symbol).first();
      await expect(tickerLine).toBeVisible();

      // 4. Assert price is visible, non-empty, and differs from previous company's price
      const priceElement = page.locator('span[style*="font-size: 32px"]').first();
      await expect(priceElement).toBeVisible();
      const currentPriceText = (await priceElement.textContent()) || '';
      expect(currentPriceText.length).toBeGreaterThan(1);
      expect(currentPriceText).not.toBe('—');

      if (previousPrice) {
        expect(currentPriceText).not.toBe(previousPrice);
      }
      previousPrice = currentPriceText;

      console.log(`✓ Verified ${item.symbol}: "${headingText}" at ${currentPriceText}`);
    }
  });

  test('Unknown ticker (/company/UNKNOWNXYZ) displays "Company not found" with search bar', async ({ page }) => {
    await page.goto('/company/UNKNOWNXYZ', { waitUntil: 'domcontentloaded' });

    // Must not show Reliance Industries
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    const headingText = await heading.textContent();
    expect(headingText).toContain('Company not found');
    expect(headingText).not.toContain('Reliance');

    // Must show search input
    const searchInput = page.locator('input[placeholder*="Search by ticker"]');
    await expect(searchInput).toBeVisible();

    // Type query and verify interactive search
    await searchInput.fill('Apple');
    const resultItem = page.locator('text=Apple Inc.').first();
    await expect(resultItem).toBeVisible({ timeout: 10000 });

    // Click result navigates to Apple
    await resultItem.click();
    await expect(page).toHaveURL(/.*\/company\/AAPL/);
    await expect(page.locator('h1')).toContainText('Apple Inc.');
  });

  test('Ambiguous query (/company/TATA) shows disambiguation list with candidate selection', async ({ page }) => {
    await page.goto('/company/TATA', { waitUntil: 'domcontentloaded' });

    // Heading indicates disambiguation
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toContainText('Multiple matches for "TATA"');

    // Candidate buttons are visible
    const dossierButtons = page.locator('button:has-text("Open Dossier →")');
    const count = await dossierButtons.count();
    expect(count).toBeGreaterThan(1);

    // Clicking first candidate navigates to that company
    await dossierButtons.first().click();
    await expect(page.locator('h1')).not.toContainText('Multiple matches');
  });

  test('Entry point: Screener row navigation opens that company', async ({ page }) => {
    await page.goto('/screener', { waitUntil: 'domcontentloaded' });

    // Find first stock row in table
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    const rowSymbol = (await firstRow.locator('div[style*="monospace"]').textContent()) || '';
    expect(rowSymbol.length).toBeGreaterThan(0);

    // Click row
    await firstRow.click();
    await expect(page).toHaveURL(new RegExp(`/company/.*`));
  });

  test('Entry point: Markets gainer navigation opens that company', async ({ page }) => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Top gainers card
    const firstGainer = page.locator('text=Top gainers').locator('..').locator('div[style*="cursor: pointer"]').first();
    await expect(firstGainer).toBeVisible();
    await firstGainer.click();

    await expect(page).toHaveURL(new RegExp(`/company/.*`));
    const heading = await page.locator('h1').textContent();
    expect(heading).not.toContain('Reliance Industries');
  });
});
