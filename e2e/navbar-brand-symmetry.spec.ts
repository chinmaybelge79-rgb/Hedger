import { test, expect } from '@playwright/test';

test('Verify navbar brand lockup on mobile and desktop viewports', async ({ page }) => {
  // Mobile test (390x844 iPhone)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  const brandMobile = page.locator('a[title*="Hedger"]').first();
  await expect(brandMobile).toBeVisible();
  await page.locator('header').first().screenshot({
    path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/navbar_mobile_390.png'
  });

  // Desktop test (1280x800)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/markets');
  await page.waitForLoadState('networkidle');
  const brandDesktop = page.locator('a[title*="Hedger"]').first();
  await expect(brandDesktop).toBeVisible();
  await page.locator('header').first().screenshot({
    path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/navbar_desktop_1280.png'
  });
});
