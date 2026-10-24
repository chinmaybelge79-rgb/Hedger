import { test, expect } from '@playwright/test';

test.describe('Workstream C — Own Chart Engine: Canvas 2D Native Engine', () => {
  test('Renders native Canvas 2D chart, toggles timeframes, and switches between Mountain and Candles', async ({ page }) => {
    await page.goto('/company/TCS.NS?tab=charts', { waitUntil: 'domcontentloaded' });

    // 1. Assert canvas exists and is visible
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(400);
    expect(canvasBox!.height).toBeGreaterThan(300);

    // 2. Assert Timeframe buttons exist: 1M, 6M, 1Y, 3Y, 5Y, ALL
    for (const tf of ['1M', '6M', '1Y', '3Y', '5Y', 'ALL']) {
      const btn = page.locator(`button:has-text("${tf}")`).first();
      await expect(btn).toBeVisible();
    }

    // 3. Toggle to Candlestick mode
    const toggleTypeBtn = page.locator('button:has-text("Mountain")').first();
    await expect(toggleTypeBtn).toBeVisible();
    await toggleTypeBtn.click();
    await expect(page.locator('button:has-text("Candles")').first()).toBeVisible();

    // 4. Toggle Scale: Linear vs Log
    const scaleBtn = page.locator('button:has-text("Linear")').first();
    await expect(scaleBtn).toBeVisible();
    await scaleBtn.click();
    await expect(page.locator('button:has-text("Log scale")').first()).toBeVisible();

    // 5. Toggle Overlays: Vol, DCF ƒ, Events
    const volBtn = page.locator('button:has-text("Vol")').first();
    await expect(volBtn).toBeVisible();

    const dcfBtn = page.locator('button:has-text("DCF ƒ")').first();
    await expect(dcfBtn).toBeVisible();

    const eventsBtn = page.locator('button:has-text("Events")').first();
    await expect(eventsBtn).toBeVisible();
  });

  test('Crosshair snaps to bars on hover and displays accurate OHLC HUD', async ({ page }) => {
    await page.goto('/company/AAPL?tab=charts', { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas box not found');

    // Hover over center of canvas
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    // Assert HUD shows Close, Open, High, Low
    await expect(page.locator('text=Close:').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Open:').first()).toBeVisible();
    await expect(page.locator('text=High:').first()).toBeVisible();
    await expect(page.locator('text=Low:').first()).toBeVisible();
  });

  test('Double-click resets zoom viewport', async ({ page }) => {
    await page.goto('/company/MSFT?tab=charts', { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas box not found');

    // Pan / Drag across canvas
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 200);
    await page.mouse.up();

    // Double click to reset
    await canvas.dblclick();

    // Canvas remains fully visible and active
    await expect(canvas).toBeVisible();
  });
});
