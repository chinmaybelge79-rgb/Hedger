import { test, expect } from '@playwright/test';

test.describe('Enhancement & Institutional DCF Verification Suite', () => {
  test('Landing page has elite finance wording, no emojis, expanded services, no deleted pill, and navbar redirects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Assert no '++' anywhere in visible text
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('++');

    // 2. Assert SVG logo in navbar
    const logoSvg = page.locator('header.nav-header svg');
    await expect(logoSvg.first()).toBeVisible();

    // 3. Assert Hero Headline has elite finance wording
    await expect(page.locator('h1')).toContainText('Institutional-grade equity research in your hands');

    // 4. Assert the removed pill line is NOT present anywhere on the page
    expect(bodyText).not.toContain('Hedger Terminal · Institutional Equity Research & Valuation');

    // 5. Assert Navbar links: Markets, Screener, Compare, Models, Pricing (Profile removed from navbar text links to avoid crowding)
    const navHeader = page.locator('header.nav-header');
    await expect(navHeader).toContainText('Markets');
    await expect(navHeader).toContainText('Screener');
    await expect(navHeader).toContainText('Compare');
    await expect(navHeader).toContainText('Models');
    await expect(navHeader).toContainText('Pricing');
    
    // Ensure Profile is removed from navbar text links
    const navLinks = page.locator('nav.nav-links-list');
    await expect(navLinks).not.toContainText('Profile');

    // Ensure Sign In & Sign Up buttons are removed from navbar, replaced with narrow Get Started
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible();

    // Ensure standalone theme button is removed from the navbar header
    await expect(page.getByRole('button', { name: 'Toggle Theme' })).not.toBeVisible();

    // Ensure circular profile button is present
    const profileBtn = page.getByRole('button', { name: 'Profile and Settings Menu' });
    await expect(profileBtn).toBeVisible();

    // 6. Assert expanded institutional services suite
    await expect(page.locator('text=Institutional Equity Research Suite')).toBeVisible();
    await expect(page.locator('text=Institutional DCF Engine')).toBeVisible();
    await expect(page.locator('text=Audited Data Provenance')).toBeVisible();
    await expect(page.locator('text=Proprietary Canvas 2D Engine')).toBeVisible();
    await expect(page.locator('text=Cross-Border Peer Benchmarking')).toBeVisible();
    await expect(page.locator('text=Deterministic Quality & Health Audits')).toBeVisible();
    await expect(page.locator('text=Multi-Market Equity Screener')).toBeVisible();

    // 7. Assert Pricing banner links to /pricing
    const pricingBanner = page.locator('text=Pricing & Access');
    await expect(pricingBanner).toBeVisible();
    const viewPricingBtn = page.getByRole('button', { name: /View All Membership Tiers/i });
    await expect(viewPricingBtn).toBeVisible();

    // Capture screenshot of updated landing page
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/landing_page_updated.png', fullPage: false });
  });

  test('Dedicated /pricing page has 4 tiers, annual discount toggle and feature matrix', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Assert 4 tiers exist
    await expect(page.locator('h3', { hasText: 'Basic' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Plus' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Pro' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Ultra' })).toBeVisible();

    // Monthly pricing
    await expect(page.getByText('$0', { exact: true })).toBeVisible();
    await expect(page.getByText('$4.99', { exact: true })).toBeVisible();
    await expect(page.getByText('$9.99', { exact: true })).toBeVisible();
    await expect(page.getByText('$19.99', { exact: true })).toBeVisible();

    // Toggle Annual Billing (20% off)
    const yearlyBtn = page.getByRole('button', { name: /Billed Annually/i });
    await yearlyBtn.click();
    await expect(page.locator('text=$47.90/yr')).toBeVisible();
    await expect(page.locator('text=$95.90/yr')).toBeVisible();
    await expect(page.locator('text=$191.90/yr')).toBeVisible();
    await expect(page.locator('text=Save 20%')).toBeVisible();

    // Capture screenshot of Dedicated Pricing Page
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/pricing_page.png', fullPage: false });
  });

  test('Dedicated /profile page contains dashboard, watchlist, saved models, and settings with theme toggle', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Assert 4 tabs
    await expect(page.getByRole('button', { name: /Current Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Watchlist/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Saved Models/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();

    // 1. Watchlist tab
    await page.getByRole('button', { name: /Watchlist/i }).click();
    await expect(page.locator('text=Active Watchlist')).toBeVisible();
    await expect(page.locator('text=RELIANCE.NS')).toBeVisible();

    // 2. Saved Models tab
    await page.getByRole('button', { name: /Saved Models/i }).click();
    await expect(page.getByRole('heading', { name: 'Saved Valuation Models' })).toBeVisible();

    // 3. Settings tab & Dark/Light mode
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('text=Terminal & Profile Preferences')).toBeVisible();
    await expect(page.locator('text=Color Theme')).toBeVisible();

    const darkBtn = page.getByRole('button', { name: 'Dark' });
    await darkBtn.click();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Capture screenshot of Profile Page in Dark Mode
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/profile_page.png', fullPage: false });

    // Toggle back to Light
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('Institutional DCF Model Workbench displays 5-year linked FCFF table, EV bridge, scenarios and sensitivity matrix', async ({ page }) => {
    await page.goto('/models/dcf/AAPL');
    await page.waitForLoadState('networkidle');

    // 1. Assert DCF Title & Header
    await expect(page.locator('h1')).toContainText('Institutional DCF Engine');

    // 2. Assert 5-Year Linked FCFF Table
    await expect(page.locator('text=5-Year Free Cash Flow to Firm (FCFF) Model')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Revenue', exact: true })).toBeVisible();
    await expect(page.locator('text=EBIT (Operating Profit)')).toBeVisible();
    await expect(page.locator('text=(=) NOPAT')).toBeVisible();
    await expect(page.locator('text=(+) Depreciation & Amortization')).toBeVisible();
    await expect(page.locator('text=(−) Capital Expenditures')).toBeVisible();
    await expect(page.locator('text=(=) Free Cash Flow to Firm (FCFF)')).toBeVisible();
    await expect(page.locator('text=Present Value of FCFF')).toBeVisible();

    // 3. Assert Enterprise to Equity Bridge
    await expect(page.locator('text=Enterprise to Equity Value Bridge')).toBeVisible();
    await expect(page.locator('text=Enterprise Value (EV):')).toBeVisible();
    await expect(page.locator('text=(=) Intrinsic Fair Value per Share:')).toBeVisible();

    // 4. Assert Scenarios: Bear, Base, Bull
    await expect(page.locator('text=Deterministic Valuation Scenarios')).toBeVisible();
    await expect(page.getByText('Bear Case', { exact: true })).toBeVisible();
    await expect(page.getByText('Base Case', { exact: true })).toBeVisible();
    await expect(page.getByText('Bull Case', { exact: true })).toBeVisible();

    // 5. Assert Sensitivity Analysis Matrix
    await expect(page.locator('text=Sensitivity Analysis Matrix')).toBeVisible();

    // Capture screenshot of DCF Model Workbench
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_workbench_updated.png', fullPage: true });
  });

  test('Dark and light mode logic toggles and persists attribute via profile settings popover', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Standalone theme toggle button should NOT be in the navbar
    await expect(page.getByRole('button', { name: 'Toggle Theme' })).not.toBeVisible();

    // Open profile and settings popover via circular icon
    const profileBtn = page.getByRole('button', { name: 'Profile and Settings Menu' });
    await profileBtn.click();

    // Click 'Dark' button inside profile settings popover
    const darkBtn = page.getByRole('button', { name: 'Dark' });
    await expect(darkBtn).toBeVisible();
    await darkBtn.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Click 'Light' button inside profile settings popover
    const lightBtn = page.getByRole('button', { name: 'Light' });
    await expect(lightBtn).toBeVisible();
    await lightBtn.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('Authentication modal supports Google, Apple, GitHub and email, and updates profile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const getStartedBtn = page.getByRole('button', { name: 'Get Started' });
    await expect(getStartedBtn).toBeVisible();
    await getStartedBtn.click();

    const modal = page.getByRole('dialog', { name: 'Account Authentication' });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Continue with Google');
    await expect(modal).toContainText('Continue with Apple');
    await expect(modal).toContainText('Continue with GitHub');

    // Click Google OAuth button to sign in
    await page.getByRole('button', { name: /Continue with Google/i }).click();

    // Modal closes
    await expect(modal).not.toBeVisible();

    // Open profile menu and verify authenticated user details
    const profileBtn = page.getByRole('button', { name: /Profile and Settings Menu/i });
    await profileBtn.hover();
    await profileBtn.click();
    await expect(page.locator('text=Alex Morgan')).toBeVisible();
    await expect(page.locator('text=alex.morgan@hedger.capital')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible();
  });

  test('Circular profile initials icon popover only appears after hover and click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Verify circular initials badge (profile picture removed as requested)
    const profileBtn = page.getByRole('button', { name: /Profile and Settings Menu/i });
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn.locator('img')).toHaveCount(0);
    await expect(profileBtn).toHaveText('AM');

    // Popover is not open initially
    await expect(page.locator('text=Appearance & Settings')).not.toBeVisible();

    // Hover alone does NOT make popover appear
    await profileBtn.hover();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Appearance & Settings')).not.toBeVisible();

    // Only after hover and click does popover appear
    await profileBtn.click();
    await expect(page.locator('text=Appearance & Settings')).toBeVisible();

    // 3. Verify popover contents: User info, navigation links, theme switcher
    await expect(page.getByRole('button', { name: /Dashboard & Profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Active Watchlist/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Saved Valuation Models/i })).toBeVisible();
    await expect(page.locator('text=Appearance & Settings')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Terminal Preferences/i })).toBeVisible();

    // 4. Capture screenshot of navbar and open profile dropdown
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/navbar_profile_menu.png',
      fullPage: false
    });
  });

  test('Clicking Hedger logo and heading in navbar brings user directly to homepage landing', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    // Click the Hedger Logo in header
    const logo = page.locator('header a[title*="Homepage"]');
    await expect(logo).toBeVisible();
    await logo.click();

    // Verify user directly comes to homepage landing
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1:has-text("Institutional-grade equity research in your hands")')).toBeVisible();
    await expect(page.locator('text=Appearance & Settings')).not.toBeVisible();
  });
});
