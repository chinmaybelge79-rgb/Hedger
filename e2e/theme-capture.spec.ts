import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACTS_DIR = '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7';

test('capture theme visual verification screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Landing Page - Light Mode
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hedger-theme', 'light');
  });
  await page.reload();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'landing_light_mode.png'), fullPage: false });

  // 2. Landing Page - Dark Mode via Toggle Button
  const toggleBtn = page.locator('button[aria-label*="Mode"]');
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
  } else {
    await page.evaluate(() => {
      localStorage.setItem('hedger-theme', 'dark');
    });
    await page.reload();
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'landing_dark_mode.png'), fullPage: false });

  // 3. DCF Simulator in Dark Mode
  const dcfSection = page.locator('#dcf-sandbox-section');
  await dcfSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'dcf_sandbox_dark_mode.png'), fullPage: false });

  // 4. Markets Page in Dark Mode
  await page.goto('/markets');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'markets_dark_mode.png'), fullPage: false });

  // 5. Company Page in Dark Mode (TCS.NS)
  await page.goto('/company/TCS.NS');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'company_dark_mode.png'), fullPage: false });

  // 6. Screener Page in Dark Mode
  await page.goto('/screener');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screener_dark_mode.png'), fullPage: false });

  // 7. Pricing Page in Dark Mode
  await page.goto('/pricing');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'pricing_dark_mode.png'), fullPage: false });

  // 8. Verify Initials in Navbar (No <img>, contains AM)
  await page.goto('/');
  await page.waitForTimeout(1000);
  const profileBtn = page.locator('button[aria-label^="Profile and Settings Menu"]');
  await expect(profileBtn).toBeVisible();
  await expect(profileBtn.locator('img')).toHaveCount(0);
  await expect(profileBtn).toHaveText('AM');

  // Hover profile button to reveal profile menu popover
  await profileBtn.hover();
  await page.waitForTimeout(600);
  await expect(page.locator('text=Alex Morgan')).toBeVisible();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_initials_popover.png'), fullPage: false });

  // 9. Verify clicking Hedger logo and heading brings user directly to homepage landing
  const logoLink = page.locator('header a[title*="Homepage"]');
  await expect(logoLink).toBeVisible();
  await logoLink.click();
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL('/');
  await expect(page.locator('h1:has-text("Institutional-grade equity research in your hands")')).toBeVisible();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'logo_opens_homepage.png'), fullPage: false });

  // 10. Homepage in Dark Mode with enlarged Logo & Heading
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'logo_opens_homepage_dark.png'), fullPage: false });
});
