import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill('Chinusha4love$$');
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('NVIDIA AI Real Peer Discovery Engine', () => {
  test('Cropster Agro displays authentic industry peers instead of IT/Banking', async ({ page }) => {
    await signIn(page);

    // Navigate to Cropster Agro
    await page.goto('http://localhost:5173/company/CROPSTER.BO?tab=peers');
    await page.waitForLoadState('networkidle');

    // Switch to Peers tab if not already active
    const peersTab = page.getByRole('button', { name: 'Peers', exact: true });
    if (await peersTab.isVisible()) {
      await peersTab.click();
    }

    // Wait for the peers section to render
    const peersHeading = page.locator('h2', { hasText: 'Peer comparison' });
    await expect(peersHeading).toBeVisible({ timeout: 20000 });

    // Verify NVIDIA AI Peer Engine badge is removed (no source of AI written in it)
    const aiBadge = page.locator('text=NVIDIA AI Peer Engine');
    await expect(aiBadge).not.toBeVisible();
    const anyAiBadge = page.locator('#peers-section').locator('text=/AI Peer/i');
    await expect(anyAiBadge).toHaveCount(0);

    // Verify target company row
    const targetRow = page.locator('tr', { hasText: 'Cropster Agro Limited (Target)' });
    await expect(targetRow).toBeVisible();

    // Wait for peers table to be populated
    const peersTable = page.locator('table').first();
    await expect(peersTable).toBeVisible({ timeout: 10000 });

    // Verify that TCS, INFY, and HDFC are NOT in the peers table
    const tableText = await peersTable.innerText();
    expect(tableText).not.toContain('TCS.NS');
    expect(tableText).not.toContain('Tata Consultancy');
    expect(tableText).not.toContain('INFY.NS');
    expect(tableText).not.toContain('Infosys');
    expect(tableText).not.toContain('HDFCBANK');
    expect(tableText).not.toContain('HDFC Bank');

    // Verify authentic peers are present
    const hasAgroPeers = 
      tableText.includes('AWL.NS') || 
      tableText.includes('Adani Wilmar') || 
      tableText.includes('AWL Agri') ||
      tableText.includes('GODREJAGRO.NS') ||
      tableText.includes('Godrej Agrovet') ||
      tableText.includes('KRBL') ||
      tableText.includes('PATANJALI') ||
      tableText.includes('PIIND');

    expect(hasAgroPeers).toBe(true);

    // Capture screenshot of the Cropster Agro peers comparison section
    const peersSection = page.locator('#peers-section');
    await peersSection.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/cropster_real_peers_verified.png'
    });
  });

  test('TCS correctly displays authentic IT consulting peers', async ({ page }) => {
    await signIn(page);

    await page.goto('http://localhost:5173/company/TCS.NS?tab=peers');
    await page.waitForLoadState('networkidle');

    const peersTab = page.getByRole('button', { name: 'Peers', exact: true });
    if (await peersTab.isVisible()) {
      await peersTab.click();
    }

    const peersTable = page.locator('table').first();
    await expect(peersTable).toBeVisible({ timeout: 20000 });

    const tableText = await peersTable.innerText();
    expect(tableText).toContain('Tata Consultancy');
    expect(tableText).toContain('INFY.NS');
    expect(tableText).toContain('WIPRO.NS');

    const peersSection = page.locator('#peers-section');
    await peersSection.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/tcs_it_peers_verified.png'
    });
  });
});
