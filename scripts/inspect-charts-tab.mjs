import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/company/RELIANCE.NS', { waitUntil: 'networkidle' });

  // Click on "Charts" tab
  console.log('Clicking Charts tab...');
  await page.click('button:has-text("Charts")');
  await page.waitForTimeout(500);

  // Take screenshot of Charts tab
  await page.screenshot({ path: 'docs/screens/company_charts_tab.png' });
  console.log('Screenshot saved to docs/screens/company_charts_tab.png');

  // Check how many bars are in HedgerChart or in state
  const barsInfo = await page.evaluate(() => {
    // Check canvas element
    const canvas = document.querySelector('canvas');
    return {
      canvasExists: !!canvas,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height
    };
  });
  console.log('Canvas info:', barsInfo);

  await browser.close();
}

main().catch(console.error);
