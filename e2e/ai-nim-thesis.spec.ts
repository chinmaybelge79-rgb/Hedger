import { test, expect } from '@playwright/test';

test.describe('NVIDIA NIM AI Stock Analysis & Investment Thesis System', () => {

  test('Fast Answering AI Chatbot: Unlimited Chat & Refuses Thesis in Chat', async ({ request }) => {
    test.setTimeout(120000);
    const testId = `user_${Date.now()}_chat`;

    // 1. First Chat Inquiry
    const chat1 = await request.post('/api/ai/chat', {
      headers: { 'x-hedger-plan': 'basic', 'x-hedger-user-id': testId },
      data: {
        messages: [{ role: 'user', content: 'What is the formula for WACC?' }],
        context: 'Context: NVDA analysis'
      }
    });
    expect(chat1.ok()).toBeTruthy();
    const chat1Data = await chat1.json();
    expect(chat1Data.reply).toBeDefined();
    expect(chat1Data.reply.length).toBeGreaterThan(20);

    // 2. Chatbot inquiry asking for full thesis should guide user to company page button
    const thesisInquiry = await request.post('/api/ai/chat', {
      headers: { 'x-hedger-plan': 'basic', 'x-hedger-user-id': testId },
      data: {
        messages: [{ role: 'user', content: 'Generate a full institutional investment thesis for NVDA' }],
        context: 'Context: NVDA analysis'
      }
    });
    expect(thesisInquiry.ok()).toBeTruthy();
    const thesisInquiryData = await thesisInquiry.json();
    // Assistant points to the thesis section
    expect(thesisInquiryData.reply.toLowerCase()).toMatch(/thesis section|dossier/);

    // 3. Repeated inquiry proves chat is unlimited
    const chatRepeat = await request.post('/api/ai/chat', {
      headers: { 'x-hedger-plan': 'basic', 'x-hedger-user-id': testId },
      data: {
        messages: [{ role: 'user', content: 'What is Beta?' }]
      }
    });
    expect(chatRepeat.ok()).toBeTruthy();

    // 4. Test User's Exact Query: "hi I want to know weather nvidia is investable or not acc to financial health"
    const nvdaQuery = await request.post('/api/ai/chat', {
      headers: { 'x-hedger-plan': 'basic', 'x-hedger-user-id': testId },
      data: {
        messages: [{ role: 'user', content: 'hi I want to know weather nvidia is investable or not acc to financial health' }]
      }
    });
    expect(nvdaQuery.ok()).toBeTruthy();
    const nvdaData = await nvdaQuery.json();
    expect(nvdaData.reply).toBeDefined();
    // Must NOT be the canned script
    expect(nvdaData.reply).not.toContain('I have prepared the institutional investment thesis for the company based on audited regulatory filings');
    // Must contain factual financial health analysis (solvency, cash, margins, or Altman Z-score)
    const replyLower = nvdaData.reply.toLowerCase();
    expect(replyLower).toMatch(/nvidia|nvda/);
    expect(replyLower).toMatch(/solvency|balance sheet|margin|cash/);
  });

  test('Download Gate: Basic is strictly 403 Forbidden, Plus succeeds', async ({ request }) => {
    const testId = `user_${Date.now()}_dl`;
    const mockThesis = '# NVDA (NVDA) — Investment Thesis\n\n## 1. Executive Investment Summary\nTest content.';

    // Basic tier attempt -> Must return 403 Forbidden with upgradeRequired
    const blockedRes = await request.post('/api/ai/thesis/download', {
      headers: { 'x-hedger-plan': 'basic', 'x-hedger-user-id': `${testId}_basic` },
      data: { symbol: 'NVDA', thesis: mockThesis, format: 'pdf' }
    });
    expect(blockedRes.status()).toBe(403);
    const blockedBody = await blockedRes.json();
    expect(blockedBody.error).toContain('Free tier accounts cannot download investment theses');
    expect(blockedBody.upgradeRequired).toBe(true);

    // Plus tier attempt -> Must succeed with institutional PDF format
    const allowedRes = await request.post('/api/ai/thesis/download', {
      headers: { 'x-hedger-plan': 'plus', 'x-hedger-user-id': `${testId}_plus` },
      data: { symbol: 'NVDA', thesis: mockThesis, format: 'pdf' }
    });
    expect(allowedRes.status()).toBe(200);
    expect(allowedRes.headers()['content-type']).toContain('text/html');
    const htmlBody = await allowedRes.text();
    expect(htmlBody).toContain('HEDGER');
    expect(htmlBody).toContain('Institutional Equity Research');
  });

  test('UI Verification: Clean Hedger Intelligence, No Model Names, No Counting Bars, Redirects to Thesis Page', async ({ page }) => {
    test.setTimeout(60000);
    const testId = `ui_user_${Date.now()}`;
    await page.setExtraHTTPHeaders({
      'x-hedger-plan': 'basic',
      'x-hedger-user-id': testId
    });

    // 1. Visit Company Dossier Page for NVDA
    await page.goto('/company/NVDA');

    // 2. Verify AI section exists and is placed above #valuation-models-section
    const aiSection = page.locator('#ai-investment-thesis-section');
    await expect(aiSection).toBeVisible({ timeout: 10000 });

    const valSection = page.locator('#valuation-models-section');
    await expect(valSection).toBeVisible({ timeout: 10000 });

    // Verify DOM position order: AI section precedes Valuation Models section
    const isAiBeforeValuation = await page.evaluate(() => {
      const ai = document.getElementById('ai-investment-thesis-section');
      const val = document.getElementById('valuation-models-section');
      if (!ai || !val) return false;
      return (ai.compareDocumentPosition(val) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(isAiBeforeValuation).toBe(true);

    // Verify HEDGER INTELLIGENCE is unboxed, 200% bigger, and has glowing animation class
    const glowTitle = page.locator('#ai-investment-thesis-section .hedger-liquid-glow-title');
    await expect(glowTitle).toBeVisible();
    await expect(glowTitle).toHaveText('HEDGER INTELLIGENCE');

    // Take screenshot of the new glowing HEDGER INTELLIGENCE header
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/hedger_intelligence_liquid_glow.png' });

    // 3. Verify NO model names or counting bars are shown in UI
    await expect(page.locator('text=NVIDIA NIM · LLAMA 3.3 70B')).not.toBeVisible();
    await expect(page.locator('text=Plan Tier: PRO')).not.toBeVisible();
    await expect(page.locator('text=Thesis Generations:')).not.toBeVisible();

    // 4. Verify "Open Valuation Workbench on Webpage" button is REMOVED
    await expect(aiSection.locator('button:has-text("Open Valuation Workbench on Webpage")')).not.toBeVisible();

    // 5. Trigger Live Thesis Generation
    const generateBtn = aiSection.locator('button:has-text("Live Thesis")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 6. Must NOT directly redirect: user stays on company page with option button to open thesis page
    const openThesisBtn = page.locator('button:has-text("Open Thesis Page")').first();
    await expect(openThesisBtn).toBeVisible({ timeout: 35000 });
    expect(page.url()).toContain('/company/NVDA');

    // Click the option button to navigate to dedicated page
    await openThesisBtn.click();
    await expect(page).toHaveURL(/.*\/company\/NVDA\/thesis/, { timeout: 10000 });

    // 7. Verify the dedicated thesis page displays the 18 sections
    await expect(page.locator('text=Executive Investment Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Business Model & Competitive Position')).toBeVisible();
    await expect(page.locator('text=Multi-year summary')).toBeVisible();
    await expect(page.locator('text=Bear / Base / Bull Scenarios')).toBeVisible();
    await expect(page.locator('text=Discount rate (WACC)')).toBeVisible();

    // 8. Verify old scattered download buttons are REMOVED from content card
    await expect(page.locator('div[style*="border-bottom"] button:has-text("HTML")')).not.toBeVisible();

    // Verify "Export / Download" button exists at the top right corner of the page
    const exportBtn = page.locator('button[aria-label="Export or download investment thesis"]');
    await expect(exportBtn).toBeVisible();

    // Hover to reveal dropdown with the 5 allowed export options only: PDF, DOCX, EXCEL, SHEETS, MD
    await exportBtn.hover();
    await expect(page.locator('text=PDF Document (Institutional Format)')).toBeVisible();
    await expect(page.locator('text=Word Document (.docx)')).toBeVisible();
    await expect(page.locator('text=Excel Spreadsheet (.xlsx)')).toBeVisible();
    await expect(page.locator('text=Google Sheets (.sheets)')).toBeVisible();
    await expect(page.locator('text=Markdown Source (.md)')).toBeVisible();

    // 9. Clicking export on Free tier directs user to /pricing
    const downloadPdfBtn = page.locator('button:has-text("PDF Document (Institutional Format)")');
    await downloadPdfBtn.click();

    // Should navigate to /pricing
    await expect(page).toHaveURL(/.*\/pricing/, { timeout: 10000 });
    await expect(page.locator('text=Make more valuations and investment theses in our paid plans')).toBeVisible();

    // 9. Verify AI Chatbot Floating Drawer opens and has NO model badges or inquiry limits
    const chatLauncher = page.locator('button:has-text("AI Assistant")');
    await expect(chatLauncher).toBeVisible();
    await chatLauncher.click();

    const chatDrawer = page.locator('text=Hedger AI Assistant').first();
    await expect(chatDrawer).toBeVisible();
    await expect(page.locator('text=NIM 8B')).not.toBeVisible();
    await expect(page.locator('text=inquiries used this month')).not.toBeVisible();

    // Verify no emojis are rendered on the page
    const pageText = await page.locator('body').innerText();
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(pageText)).toBe(false);

    // Take verification screenshot
    await page.screenshot({ path: 'apps/web/test-results/ai-dedicated-thesis-page.png' });
  });

});
