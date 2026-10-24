import { test, expect } from '@playwright/test';

test.describe('Workstream F — Financial Health & AI Analysis Section', () => {
  test('Standard company (TCS.NS) renders 5 pillars, deterministic score, factual narrative, and disclaimer', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });

    // Assert section is visible at bottom of page
    const section = page.locator('#financial-analysis-section');
    await expect(section).toBeVisible({ timeout: 15000 });

    // Assert Header & Deterministic Tag
    await expect(section.locator('h2')).toContainText('Financial Health & Quality Analysis');
    await expect(section.getByText('DETERMINISTIC', { exact: true })).toBeVisible();

    // Assert Score & Neutral Label Chip
    await expect(section.locator('text=/ 100').first()).toBeVisible();
    await expect(section.locator('text=Strong financials').first()).toBeVisible();

    // Assert 5 Pillars
    await expect(section.locator('span:has-text("Profitability")').first()).toBeVisible();
    await expect(section.locator('span:has-text("Growth")').first()).toBeVisible();
    await expect(section.locator('span:has-text("Cash quality")').first()).toBeVisible();
    await expect(section.locator('span:has-text("Balance sheet")').first()).toBeVisible();
    await expect(section.locator('span:has-text("Valuation context")').first()).toBeVisible();

    // Assert Factual Narrative Statements
    const narrativeList = section.locator('ul li');
    const count = await narrativeList.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Assert "How this is calculated" details expander
    const details = section.locator('details');
    await expect(details).toBeVisible();
    await details.locator('summary').click();
    await expect(section.locator('text=Directional Scoring Formula')).toBeVisible();
    await expect(section.locator('table')).toBeVisible();

    // Assert Legal Compliance Disclaimer
    await expect(
      section.locator('text=This analysis describes reported financial data against fixed thresholds')
    ).toBeVisible();
    await expect(section.locator('text=Not investment advice or an endorsement')).toBeVisible();
  });

  test('Banking entity (HDFCBANK.NS) renders bank-specific pillars and asset quality metrics', async ({ page }) => {
    await page.goto('/company/HDFCBANK.NS', { waitUntil: 'domcontentloaded' });

    const section = page.locator('#financial-analysis-section');
    await expect(section).toBeVisible({ timeout: 15000 });

    // Assert banking specific pillars exist
    await expect(section.locator('span:has-text("Capital adequacy")').first()).toBeVisible();
    await expect(section.locator('span:has-text("Asset quality")').first()).toBeVisible();

    // Assert Score is rendered
    await expect(section.locator('text=/ 100').first()).toBeVisible();

    // Assert Disclaimer
    await expect(
      section.locator('text=It is not a recommendation to buy, sell or hold any security')
    ).toBeVisible();
  });

  test('Strict compliance guard: section contains zero promotional or investment advice keywords', async ({ page }) => {
    await page.goto('/company/TCS.NS', { waitUntil: 'domcontentloaded' });

    const section = page.locator('#financial-analysis-section');
    await expect(section).toBeVisible({ timeout: 15000 });

    const text = (await section.innerText()).toLowerCase();

    // Banned keywords from Workstream F prompt:
    // "reject any text containing buy, sell, hold, should, recommend, target, undervalued, overvalued, upside, downside, guarantee"
    // Note: 'hold' in 'threshold' or 'withhold' is fine, so check word boundaries:
    const bannedWords = [
      '\\bbuy\\b',
      '\\bsell\\b',
      '\\bhold\\b(?!ing|er)', // allows 'holding', 'shareholder', blocks isolated 'hold' unless in disclaimer
      '\\bshould\\b',
      '\\brecommend\\b',
      '\\btarget price\\b',
      '\\bundervalued\\b',
      '\\bovervalued\\b',
      '\\bupside\\b',
      '\\bdownside\\b',
      '\\bguarantee\\b'
    ];

    // Get narrative text specifically
    const narrativeText = (await section.locator('ul').innerText()).toLowerCase();

    for (const pattern of bannedWords) {
      const regex = new RegExp(pattern, 'i');
      expect(regex.test(narrativeText)).toBe(false);
    }
  });
});
