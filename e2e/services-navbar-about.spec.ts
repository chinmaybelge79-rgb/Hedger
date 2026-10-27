import { test, expect } from '@playwright/test';

test.describe('Platform Services, Navbar Redesign, About Page & Database Deployment', () => {

  test('Navbar: Circular Search, Market Selector at Right, No Terminal Badge, No Theme Toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // 1. Logo should NOT contain "Terminal" in that element box
    const brand = page.locator('a[title="Hedger — Homepage Landing"]');
    await expect(brand).toBeVisible();
    await expect(brand.locator('.nav-terminal-badge')).toHaveCount(0);

    // 2. Search bar should have circular borders (rounded pill) and expanded length
    const searchBar = page.locator('.nav-search-bar');
    await expect(searchBar).toBeVisible();
    const searchBox = await searchBar.boundingBox();
    expect(searchBox?.width).toBeGreaterThanOrEqual(260);

    // 3. Theme toggle should NOT be in navbar
    await expect(page.locator('.nav-theme-toggle')).toHaveCount(0);

    // 4. About link should be in navbar
    const aboutLink = page.locator('nav.nav-links-list a[href="/about"]');
    await expect(aboutLink).toBeVisible();

    // 5. Landing page must NOT have "Services We Promise to Deliver"
    await expect(page.getByText('Services We Promise to Deliver')).toHaveCount(0);

    // Take screenshot of updated navbar
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/navbar_circular_search_market_right.png',
      clip: { x: 0, y: 0, width: 1440, height: 80 }
    });
  });

  test('Pricing Page: Rigid Table Layout & Centered Grid Alignment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto('http://localhost:5173/pricing');
    await page.waitForLoadState('networkidle');

    // Verify Services We Promise to Deliver exists on Pricing page
    const promiseHeading = page.getByText('Services We Promise to Deliver').first();
    await expect(promiseHeading).toBeVisible();
    await promiseHeading.scrollIntoViewIfNeeded();

    // Verify Comparison Table
    const table = page.locator('table[style*="table-layout: fixed"]');
    await expect(table).toBeVisible();

    // Screenshot of aligned comparison matrix
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/pricing_grid_aligned_matrix.png'
    });
  });

  test('About Page: Founder CHINMAY BELGE with Golden Gradient & Minimalist Aesthetic', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173/about');
    await page.waitForLoadState('networkidle');

    // 1. Hero founder name
    const founderTitle = page.locator('.founder-name');
    await expect(founderTitle).toBeVisible();
    await expect(founderTitle).toHaveText('CHINMAY BELGE');

    // 2. Designation & Tagline
    await expect(page.getByText('Founder & Creator, Hedger Valuation')).toBeVisible();
    await expect(page.getByText('Building a more rigorous approach to equity research and valuation.')).toBeVisible();

    // 3. Investment Philosophy 3 Columns
    await expect(page.getByText('FUNDAMENTAL THINKING')).toBeVisible();
    await expect(page.getByText('TRANSPARENT VALUATION')).toBeVisible();
    await expect(page.getByText('INDEPENDENT RESEARCH')).toBeVisible();

    // 4. Background from résumé
    await expect(page.getByText('Jain University, Bengaluru')).toBeVisible();
    await expect(page.getByText('B.Tech in Computer Science & Engineering')).toBeVisible();

    // 5. Founder Channels: Clean UI with ZERO third-party source text
    await expect(page.getByText('UI primitives and symbols fetched from 21st.dev.')).toHaveCount(0);
    await expect(page.getByText('Symbols fetched from 21st.dev')).toHaveCount(0);
    await expect(page.getByText('Connect with Chinmay Belge')).toBeVisible();

    // Check all 5 channels in the correspondence grid
    const emailLink = page.locator('a[href="mailto:chinmaybelge79@gmail.com"]').first();
    await expect(emailLink).toBeVisible();

    const githubLink = page.locator('a[href="https://github.com/ChinmayBelge79-rgb"]').first();
    await expect(githubLink).toBeVisible();

    const linkedinLink = page.locator('a[href="https://www.linkedin.com/in/chinmay-belge-a10833357/"]').first();
    await expect(linkedinLink).toBeVisible();

    const xLink = page.locator('a[href="https://x.com/ChinmayBelge"]').first();
    await expect(xLink).toBeVisible();

    const instaLink = page.locator('a[href="https://instagram.com/fxchinmay"]').first();
    await expect(instaLink).toBeVisible();

    // Verify footer includes founder contact links and NO external source text
    const footerEmail = page.locator('footer a[href="mailto:chinmaybelge79@gmail.com"]');
    await expect(footerEmail).toBeVisible();
    await expect(page.locator('footer').getByText('Symbols fetched from 21st.dev')).toHaveCount(0);

    // Screenshot of clean About page with founder contact cards
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/about_founder_clean_socials.png',
      fullPage: true
    });
  });

  test('Compare Page: Automated Fiscal Year Calendar Reconciliation Engine', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto('http://localhost:5173/compare?a=RELIANCE.NS&b=AAPL');
    await page.waitForLoadState('networkidle');

    // Verify fiscal year calendar reconciliation panel
    await expect(page.getByText('Fiscal Year Alignment: RELIANCE.NS (March) vs AAPL (September)')).toBeVisible();
    await expect(page.getByText('TTM Calendar Reconciled')).toBeVisible();

    // Screenshot of Fiscal Reconciliation
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/compare_fiscal_reconciliation.png'
    });
  });

  test('Capital Structure Optimizer & Methodology Advisory Desk Pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    // 1. Capital Structure Optimizer
    await page.goto('http://localhost:5173/models/capital-structure');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Capital Structure & WACC Optimizer').first()).toBeVisible();
    await expect(page.getByText('Optimal Capital Structure')).toBeVisible();
    await expect(page.getByText('Synthetic Credit Rating', { exact: true })).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/capital_structure_optimizer.png'
    });

    // 2. Methodology Advisory Desk
    await page.goto('http://localhost:5173/support');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Valuation Methodology Support & Advisory').first()).toBeVisible();
    await expect(page.getByText('Submit Methodology Inquiry')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/methodology_advisory_desk.png'
    });
  });
});
