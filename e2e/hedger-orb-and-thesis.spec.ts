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

test.describe('Hedger Intelligence Live Plasma Orb & Enhanced Thesis Card', () => {
  test('Renders live Three.js Plasma Orb in front of HEDGER INTELLIGENCE without removed subtitle', async ({ page }) => {
    await signIn(page);

    await page.goto('http://localhost:5173/company/AAPL');
    await page.waitForLoadState('networkidle');

    // Locate AI Investment Thesis Section
    const thesisSection = page.locator('#ai-investment-thesis-section');
    await expect(thesisSection).toBeVisible({ timeout: 10000 });

    // Scroll to thesis section
    await thesisSection.scrollIntoViewIfNeeded();

    // Verify Three.js Canvas Orb is visible inside the card
    const orbCanvas = thesisSection.locator('canvas').first();
    await expect(orbCanvas).toBeVisible();

    // Verify HEDGER INTELLIGENCE title is visible
    const title = thesisSection.locator('.hedger-intelligence-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('HEDGER INTELLIGENCE');

    // Verify the removed line is strictly absent
    const pageText = await thesisSection.innerText();
    expect(pageText).not.toContain('Deterministic Engine & Institutional Thesis Template');

    // Verify capability badges
    expect(pageText).toContain('18-Section Hedger Template');
    expect(pageText).toContain('Reverse DCF Expectations & Catalysts');
    expect(pageText).toContain('Deterministic 3-Scenario Matrix');

    // Wait 1 second for WebGL animation frames to render smoothly
    await page.waitForTimeout(1000);

    // Capture screenshot of the highlighted thesis card
    const card = thesisSection.locator('.ai-thesis-highlight-card');
    await card.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/hedger_intelligence_plasma_orb_card.png'
    });

    // Also verify Thesis Page top header with orb
    await page.goto('http://localhost:5173/company/AAPL/thesis');
    await page.waitForLoadState('networkidle');

    const thesisHeaderOrb = page.locator('#thesis-top-toolbar .hedger-intelligence-title');
    await expect(thesisHeaderOrb).toBeVisible({ timeout: 10000 });

    const toolbar = page.locator('#thesis-top-toolbar');
    await toolbar.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/hedger_intelligence_thesis_header.png'
    });
  });
});
