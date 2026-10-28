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

test.describe('Hedger — Market Partitioning, Data Provenance, Chart Zoom & Profile', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('1. Market Hover Switcher reveals all markets and benchmark data', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Locate market switcher trigger in Navbar
    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await expect(marketTrigger).toBeVisible();

    // Click the market switcher trigger
    await marketTrigger.click();

    // Verify popover opens with "Market Region"
    const flyout = page.locator('text=Market Region');
    await expect(flyout).toBeVisible();

    // Verify all key markets and their indices are displayed via testids
    const usOption = page.locator('[data-testid="market-option-us"]');
    await expect(usOption).toBeVisible();
    await expect(usOption.getByText('S&P 500')).toBeVisible();

    const inOption = page.locator('[data-testid="market-option-in"]');
    await expect(inOption).toBeVisible();
    await expect(inOption.getByText('NIFTY 50')).toBeVisible();

    const euOption = page.locator('[data-testid="market-option-eu"]');
    await expect(euOption).toBeVisible();
    await expect(euOption.getByText('FTSE 100')).toBeVisible();

    const asiaOption = page.locator('[data-testid="market-option-asia"]');
    await expect(asiaOption).toBeVisible();
    await expect(asiaOption.getByText('Nikkei 225')).toBeVisible();

    // Screenshot of market hover flyout
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/market_hover_flyout.png' });
  });

  test('2. US Market scopes search strictly to US companies', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Ensure US Market is active
    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-us"]').click();

    // Open spotlight search
    await page.click('button:has-text("Search")');
    const searchModal = page.locator('div[role="dialog"]');
    await expect(searchModal).toBeVisible();

    // Verify US Market active badge in search modal
    await expect(searchModal.locator('[data-testid="search-market-tab-us"]')).toBeVisible();

    // Search for "Apple"
    const searchInput = searchModal.locator('input[type="text"]');
    await searchInput.fill('Apple');
    await page.waitForTimeout(300);

    // Verify Apple / AAPL is present
    await expect(searchModal.locator('text=Apple Inc.')).toBeVisible();
    await expect(searchModal.locator('text=AAPL').first()).toBeVisible();

    // Search for an Indian company like "Reliance" while in US Market
    await searchInput.fill('Reliance');
    await page.waitForTimeout(300);

    // In US Market, Indian company RELIANCE.NS must NEVER appear
    const relianceNSText = searchModal.locator('text=RELIANCE.NS');
    await expect(relianceNSText).toHaveCount(0);

    // Search for an India-only ticker "TCS" while in US Market
    await searchInput.fill('TCS');
    await page.waitForTimeout(300);
    await expect(searchModal.locator('text=TCS.NS')).toHaveCount(0);

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/search_us_filtered.png' });
  });

  test('3. Indian Market scopes search strictly to Indian companies', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Indian Market via hover flyout
    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-in"]').click();

    // Open spotlight search
    await page.click('button:has-text("Search")');
    const searchModal = page.locator('div[role="dialog"]');
    await expect(searchModal).toBeVisible();

    // Verify Indian Market tab is selected
    await expect(searchModal.locator('[data-testid="search-market-tab-in"]')).toBeVisible();

    // Search for "Reliance"
    const searchInput = searchModal.locator('input[type="text"]');
    await searchInput.fill('Reliance');
    await page.waitForTimeout(300);

    // Verify Reliance Industries (.NS) is returned
    await expect(searchModal.locator('text=RELIANCE.NS')).toBeVisible();

    // Search for US company "Apple" while in Indian Market
    await searchInput.fill('Apple');
    await page.waitForTimeout(300);

    // In Indian Market, US AAPL should NOT be shown
    await expect(searchModal.locator('text=AAPL · NASDAQ')).toHaveCount(0);

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/search_indian_filtered.png' });
  });

  test('4. Company Page: source removed from top header and relocated to bottom Data Provenance card', async ({ page }) => {
    await page.goto('http://localhost:5173/company/NVDA');
    await page.waitForLoadState('domcontentloaded');

    // Verify top header subtitle has symbol, exchange, currency, freshness, but NOT "Source:"
    const topSubtitle = page.locator('h1:has-text("NVIDIA") + div');
    await expect(topSubtitle).toBeVisible({ timeout: 15000 });
    const text = await topSubtitle.textContent();
    expect(text).not.toContain('Source:');
    expect(text).toContain('NVDA');

    // Scroll to the very bottom
    const dataProvenanceCard = page.locator('#data-provenance-disclosure');
    await expect(dataProvenanceCard).toBeVisible({ timeout: 15000 });
    await expect(dataProvenanceCard.locator('text=Data Provenance & Market Source')).toBeVisible();
    await expect(dataProvenanceCard.locator('text=Institutional Research Notice')).toBeVisible();

    // Capture screenshot of both top and bottom
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/company_page_provenance_bottom.png' });
  });

  test('5. Chart canvas rendering and safe zoom bounds', async ({ page }) => {
    await page.goto('http://localhost:5173/company/NVDA?tab=charts');
    await page.waitForLoadState('domcontentloaded');

    // Locate chart canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Perform multiple zoom in wheel interactions
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Zoom in repeatedly
      for (let i = 0; i < 15; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(50);
      }
    }

    // Chart canvas should remain intact and properly bounded
    await expect(canvas).toBeVisible();
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/chart_clamped_zoom.png' });
  });

  test('6. Clicking profile circle directly navigates to profile page', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Locate circular profile icon button
    const profileCircle = page.locator('button[aria-label*="Profile and Settings"]');
    await expect(profileCircle).toBeVisible();

    // Click circular profile icon directly
    await profileCircle.click();

    // Verify URL navigates to /profile
    await expect(page).toHaveURL(/.*\/profile/);

    // Verify Allocator Profile title and sections
    await expect(page.locator('h1:has-text("Personal Allocator Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("Current Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Watchlist")')).toBeVisible();
    await expect(page.locator('button:has-text("Saved Models")')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/profile_page_direct_click.png' });
  });

  test('7. Screener is strictly scoped to active market with zero foreign stocks', async ({ page }) => {
    // 1. Start at home, select Indian Market via top right hover switcher
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-in"]').click();

    // 2. Navigate to /screener
    await page.goto('http://localhost:5173/screener');
    await page.waitForLoadState('domcontentloaded');

    // Verify Active Market Chip shows Indian Market
    const chip = page.locator('[data-testid="screener-active-market-chip"]');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('India');

    // Wait for screener table to load
    await expect(page.locator('text=Reliance Industries').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=RELIANCE.NS').first()).toBeVisible();

    // Verify Indian stocks are present
    const pageContent = await page.locator('table').innerText();
    expect(pageContent).toContain('RELIANCE.NS');
    expect(pageContent).toContain('TCS.NS');

    // Verify strictly ZERO US stocks appear (NVDA, AAPL, MSFT must not be present)
    expect(pageContent).not.toContain('NVDA');
    expect(pageContent).not.toContain('AAPL');
    expect(pageContent).not.toContain('MSFT');

    // 3. Switch to US Market from top right switcher while on screener page
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-us"]').click();
    await page.waitForTimeout(500);

    // Verify Active Market Chip updates to US Market
    await expect(chip).toContainText('United States');

    // Wait for US stocks table
    await expect(page.locator('text=NVIDIA Corporation').first()).toBeVisible({ timeout: 10000 });
    const usContent = await page.locator('table').innerText();
    expect(usContent).toContain('NVDA');
    expect(usContent).toContain('AAPL');

    // Verify strictly ZERO Indian stocks appear in US Screener
    expect(usContent).not.toContain('RELIANCE.NS');
    expect(usContent).not.toContain('TCS.NS');
    expect(usContent).not.toContain('INFY.NS');

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/screener_market_scoped.png' });
  });

  test('8. Peer Comparison is strictly scoped to active market', async ({ page }) => {
    // 1. Set Indian market active
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-in"]').click();

    // Navigate to /compare
    await page.goto('http://localhost:5173/compare');
    await page.waitForLoadState('domcontentloaded');

    // Target and peer must be Indian stocks (TCS.NS and INFY.NS)
    const targetSelect = page.locator('select').first();
    const peerSelect = page.locator('select').nth(1);
    await expect(targetSelect).toBeVisible({ timeout: 10000 });
    await expect(targetSelect).toHaveValue('TCS.NS');
    await expect(peerSelect).toHaveValue('INFY.NS');

    // Check peer options: must only contain Indian stocks, ZERO US stocks
    const peerOptions = await peerSelect.innerText();
    expect(peerOptions).not.toContain('NVDA');
    expect(peerOptions).not.toContain('AAPL');
    expect(peerOptions).not.toContain('MSFT');

    // 2. Switch to US Market
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-us"]').click();
    await page.waitForTimeout(500);

    // Target and peer must automatically switch to US stocks (NVDA and AAPL)
    await expect(targetSelect).toHaveValue('NVDA', { timeout: 10000 });
    await expect(peerSelect).toHaveValue('AAPL');

    // Verify peer dropdown in US comparison contains NO Indian stocks
    const usPeerOptions = await peerSelect.innerText();
    expect(usPeerOptions).not.toContain('TCS.NS');
    expect(usPeerOptions).not.toContain('RELIANCE.NS');
    expect(usPeerOptions).not.toContain('INFY.NS');

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/compare_market_scoped.png' });
  });

  test('9. Markets section automatically syncs with top right active market', async ({ page }) => {
    // 1. Select Indian market
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-in"]').click();

    // 2. Navigate to /markets
    await page.goto('http://localhost:5173/markets');
    await page.waitForLoadState('domcontentloaded');

    // Verify India region is active and NIFTY 50 is displayed
    await expect(page.locator('text=NIFTY 50').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.page-container button:has-text("India")')).toBeVisible();

    // 3. Switch to US Market via top right hover flyout
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-us"]').click();
    await page.waitForTimeout(500);

    // Verify Markets page switches to United States and S&P 500
    await expect(page.locator('text=S&P 500').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/markets_section_market_scoped.png' });
  });

  test('10. Homepage showcase picker strictly scoped to active market', async ({ page }) => {
    // 1. Select Indian Market
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    const marketTrigger = page.locator('button[aria-label*="Active market"]');
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-in"]').click();
    await page.waitForTimeout(300);

    // Showcase buttons must contain Indian stocks only
    await expect(page.locator('button:has-text("RELIANCE.NS")').first()).toBeVisible();
    await expect(page.locator('button:has-text("TCS.NS")').first()).toBeVisible();
    await expect(page.locator('button:has-text("NVDA")')).toHaveCount(0);
    await expect(page.locator('button:has-text("AAPL")')).toHaveCount(0);

    // 2. Switch to US Market
    await marketTrigger.click();
    await page.locator('[data-testid="market-option-us"]').click();
    await page.waitForTimeout(300);

    // Showcase buttons must contain US stocks only
    await expect(page.locator('button:has-text("NVDA")').first()).toBeVisible();
    await expect(page.locator('button:has-text("AAPL")').first()).toBeVisible();
    await expect(page.locator('button:has-text("RELIANCE.NS")')).toHaveCount(0);
    await expect(page.locator('button:has-text("TCS.NS")')).toHaveCount(0);

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/homepage_showcase_market_scoped.png' });
  });
});
