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

test.describe('Hedger — AI Assistant Risk Disclaimers & Inquiries Header', () => {
  test('Backend API enforces "on own risk" and "directional momentum" and forbids direct investment statements', async ({ request }) => {
    const res = await request.post('http://localhost:5173/api/ai/chat', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [{ role: 'user', content: 'hi I want to know whether nvidia is investable or not acc to financial health' }]
      }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.reply).toBeDefined();

    const replyLower = data.reply.toLowerCase();
    // Must contain "own risk"
    expect(replyLower).toMatch(/own\s+risk/);
    // Must contain "directional momentum"
    expect(replyLower).toMatch(/directional\s+momentum/);

    // Must NOT contain promotional/advisory phrases instructing user to invest
    expect(replyLower).not.toContain('is exceptionally investable');
    expect(replyLower).not.toContain('invest on this stock');
    expect(replyLower).not.toContain('invest in this stock');
  });

  test('UI AI Chatbot Drawer has removed "Unlimited Institutional Inquiries" line and enforces risk statement', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);

    // Click floating AI Assistant launcher
    const launcher = page.locator('button:has-text("AI Assistant")');
    await expect(launcher).toBeVisible();
    await launcher.click();

    // Confirm Drawer is open
    const drawerHeader = page.locator('span:has-text("Hedger AI Assistant")');
    await expect(drawerHeader).toBeVisible();

    // Confirm "Unlimited Institutional Inquiries & Research Assistant" line is REMOVED
    await expect(page.locator('text=Unlimited Institutional Inquiries')).toHaveCount(0);
    await expect(page.locator('text=Unlimited Institutional Inquiries & Research Assistant')).toHaveCount(0);

    // Verify initial message includes "own risk" and "directional momentum"
    const welcomeBubble = page.locator('div[style*="border-radius"]').filter({ hasText: 'Hedger AI Assistant active' }).first();
    await expect(welcomeBubble).toBeVisible();
    const welcomeText = await welcomeBubble.innerText();
    expect(welcomeText.toLowerCase()).toContain('own risk');
    expect(welcomeText.toLowerCase()).toContain('directional momentum');
    expect(welcomeText.toLowerCase()).toContain('not recommend or advise to invest');

    // Verify footer disclaimer
    await expect(page.locator('text=All decisions on own risk. Market conditions display directional momentum')).toBeVisible();

    // Send question
    const input = page.locator('input[placeholder*="Ask about valuation"]');
    await input.fill('is NVIDIA investable according to financial health?');
    await page.locator('button[type="submit"]:has-text("Send")').click();

    // Wait for assistant response to render (allows for external NIM timeout up to 18s)
    const responseMsg = page.locator('div[style*="border-radius"]').filter({ hasText: 'NVIDIA (NVDA)' }).first();
    await expect(responseMsg).toBeVisible({ timeout: 25000 });
    const responseText = await responseMsg.innerText();
    const respLower = responseText.toLowerCase();

    // Verify mandatory risk and directional momentum statement in response
    expect(respLower).toContain('own risk');
    expect(respLower).toContain('directional momentum');
    expect(respLower).not.toContain('is exceptionally investable');

    // Take screenshot of AI drawer
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/ai_assistant_risk_momentum_drawer.png' });
  });
});
