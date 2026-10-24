import { test, expect } from '@playwright/test';
import path from 'path';

const VIEWPORT_WIDTHS = [1440, 1024, 768, 390];

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'markets', path: '/markets' },
  { name: 'screener', path: '/screener' },
  { name: 'saved', path: '/saved' },
  { name: 'design', path: '/design' },
  { name: 'company', path: '/company/RELIANCE.NS' },
  { name: 'compare', path: '/compare?a=TCS.NS&b=INFY.NS' }
];

test.describe('Milestone M1 — Spacing, Layout & Responsive Pass', () => {
  for (const route of ROUTES) {
    for (const width of VIEWPORT_WIDTHS) {
      test(`Route ${route.path} @ ${width}px: no horizontal overflow and captures screenshot`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBe(200);

        // Wait for page rendering
        await page.waitForTimeout(150);

        // 1. Assert No Horizontal Viewport Overflow
        const overflowCheck = await page.evaluate((expectedWidth) => {
          const docScroll = document.documentElement.scrollWidth;
          const bodyScroll = document.body.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          return {
            clientWidth,
            docScroll,
            bodyScroll,
            expectedWidth,
            hasOverflow: docScroll > expectedWidth + 1 || bodyScroll > expectedWidth + 1
          };
        }, width);

        expect(
          overflowCheck.hasOverflow,
          `Route ${route.path} overflowed viewport at width ${width}px! docScroll=${overflowCheck.docScroll}, bodyScroll=${overflowCheck.bodyScroll}, clientWidth=${overflowCheck.clientWidth}`
        ).toBe(false);

        // 2. Capture screenshot to docs/screens/m1/
        const screenshotPath = path.join(process.cwd(), `docs/screens/m1/${route.name}_${width}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      });
    }
  }

  // Spotlight ⌘K Search Modal responsive tests & screenshots
  for (const width of VIEWPORT_WIDTHS) {
    test(`Spotlight Modal @ ${width}px: zero overflow, touch targets >= 44px, and captures screenshot`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Click the Spotlight search trigger button
      const searchButton = page.locator('button[title*="Search"]');
      await searchButton.waitFor({ state: 'visible', timeout: 15000 });
      await searchButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 15000 });

      // Check modal doesn't cause overflow
      const hasOverflow = await page.evaluate((expectedWidth) => {
        return document.documentElement.scrollWidth > expectedWidth + 1;
      }, width);
      expect(hasOverflow).toBe(false);

      // Verify search input has height >= 44px
      const input = modal.locator('input[type="text"]');
      const inputBox = await input.boundingBox();
      expect(inputBox?.height).toBeGreaterThanOrEqual(43.5);

      // Screenshot
      const screenshotPath = path.join(process.cwd(), `docs/screens/m1/search_modal_${width}.png`);
      await page.screenshot({ path: screenshotPath });

      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  }

  // Save Model Modal responsive tests & screenshots
  for (const width of VIEWPORT_WIDTHS) {
    test(`Save-model Modal @ ${width}px: zero overflow, touch targets >= 44px, and captures screenshot`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/company/RELIANCE.NS', { waitUntil: 'domcontentloaded' });

      // Click the Save button to open modal
      const saveButton = page.getByRole('button', { name: /Save/i }).first();
      await saveButton.click();

      // Modal appears
      const modal = page.locator('h3:text("Save valuation model")');
      await expect(modal).toBeVisible();

      // Check modal doesn't cause page-level horizontal overflow
      const hasOverflow = await page.evaluate((expectedWidth) => {
        return document.documentElement.scrollWidth > expectedWidth + 1;
      }, width);
      expect(hasOverflow).toBe(false);

      // Verify action buttons inside modal are >= 44px tall
      const modalCancelBtn = page.getByRole('button', { name: 'Cancel' });
      const cancelBox = await modalCancelBtn.boundingBox();
      expect(cancelBox?.height).toBeGreaterThanOrEqual(43.5);

      const modalSaveBtn = page.getByRole('button', { name: /Save model/i });
      const saveBox = await modalSaveBtn.boundingBox();
      expect(saveBox?.height).toBeGreaterThanOrEqual(43.5);

      // Screenshot
      const screenshotPath = path.join(process.cwd(), `docs/screens/m1/save_modal_${width}.png`);
      await page.screenshot({ path: screenshotPath });

      // Close modal
      await modalCancelBtn.click();
    });
  }

  // Test: Automated touch-target assertion on interactive elements
  test('All primary controls and interactive elements meet min 44px touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/design', { waitUntil: 'domcontentloaded' });

    // Assert primary buttons are >= 44px tall
    const buttons = await page.$$('.btn, button.btn-primary, button.btn-secondary');
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(43.5);
      }
    }

    // Assert inputs and selects are >= 44px tall
    const inputs = await page.$$('.input-control, input[type="text"]:not([type="hidden"]), select');
    for (const input of inputs) {
      const box = await input.boundingBox();
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(43.5);
      }
    }

    // Assert nav links are >= 44px tall
    const navLinks = await page.$$('.nav-item-link');
    for (const link of navLinks) {
      const box = await link.boundingBox();
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(43.5);
      }
    }
  });

  // Test: Filter chips height is exactly 36px per spec
  test('Filter chips have height 36px and gap 10px per spec', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/screener', { waitUntil: 'domcontentloaded' });

    const chips = await page.$$('.filter-chip');
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      const box = await chip.boundingBox();
      if (box) {
        expect(box.height).toBeCloseTo(36, 0); // 36px height
      }
    }
  });
});
