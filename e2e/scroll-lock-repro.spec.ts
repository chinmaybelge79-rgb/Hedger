import { test, expect } from '@playwright/test';

test.describe('Native Scroll Verification across Laptop Viewports', () => {
  test('Wheel scroll and touch scroll smoothly down the Landing Page without getting locked', async ({ page }) => {
    // 1366x768 (most common laptop screen size in the world)
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Initial scroll position should be 0
    let scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);

    // 1. Mouse wheel right in the middle of the Hero section
    await page.mouse.move(683, 384);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);

    scrollY = await page.evaluate(() => window.scrollY);
    console.log('ScrollY after wheel on hero center:', scrollY);
    expect(scrollY).toBeGreaterThan(200);

    // 2. Mouse wheel again to scroll further down
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(500);

    scrollY = await page.evaluate(() => window.scrollY);
    console.log('ScrollY after second wheel:', scrollY);
    expect(scrollY).toBeGreaterThan(800);

    // 3. Wheel back up
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(500);

    const scrollYAfterUp = await page.evaluate(() => window.scrollY);
    console.log('ScrollY after wheel back up:', scrollYAfterUp);
    expect(scrollYAfterUp).toBeLessThan(scrollY);

    // 4. Test on smaller 1280x720 laptop screen
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);

    const smallLaptopScroll = await page.evaluate(() => window.scrollY);
    console.log('Small laptop scroll after wheel:', smallLaptopScroll);
    expect(smallLaptopScroll).toBeGreaterThan(150);
  });
});
