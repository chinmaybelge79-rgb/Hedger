import { test, expect } from '@playwright/test';

test('Verify NVIDIA market cap displays $5.09T live data correctly on landing page showcase and company page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Find the showcase section and click NVDA tab
  const nvdaBtn = page.getByRole('button', { name: 'NVDA' }).first();
  await expect(nvdaBtn).toBeVisible();
  await nvdaBtn.click();
  await page.waitForTimeout(1000);

  // Assert Company title is NVIDIA Corporation
  await expect(page.getByRole('heading', { name: 'NVIDIA Corporation' }).first()).toBeVisible();

  // Assert Market Cap is in the $5.08T - $5.09T range (not $3.48T or $3.8T)
  const marketCapElement = page.locator('text=Market Cap').first().locator('..');
  await expect(marketCapElement).toContainText('$5.09T');
  await expect(marketCapElement).not.toContainText('$3.48T');
  await expect(marketCapElement).not.toContainText('$3.8T');

  // Assert live price is displayed
  await expect(page.locator('text=$210.96').first()).toBeVisible();

  // Take screenshot of the corrected showcase matching user uploaded region
  await page.screenshot({
    path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/nvidia_market_cap_corrected.png',
    clip: { x: 0, y: 440, width: 1440, height: 580 }
  });

  // Verify company page /company/NVDA
  await page.goto('/company/NVDA');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /NVIDIA Corporation/i }).first()).toBeVisible();
  await expect(page.locator('text=Market Cap').first().locator('..')).toContainText('$5.09T');

  // Take screenshot of company page
  await page.screenshot({
    path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/nvidia_company_page_market_cap.png',
    clip: { x: 0, y: 0, width: 1440, height: 600 }
  });
});
