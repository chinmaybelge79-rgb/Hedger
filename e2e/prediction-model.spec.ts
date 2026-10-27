import { test, expect } from '@playwright/test';

test.describe('Change A, B & C: Prediction Model & Valuation Status Engine', () => {
  test('Change A: dossier page contains no intrinsic value or recommendation signals', async ({ page }) => {
    await page.goto('/company/NVDA');
    await page.waitForSelector('[data-testid="prediction-model-card"]', { timeout: 15000 });

    // Extract text content of the entire main dossier body
    const bodyText = await page.innerText('body');
    const lowerBody = bodyText.toLowerCase();

    // Verify forbidden marketing & signal words
    const bannedWords = [
      'intrinsic value',
      'margin of safety',
      'buy signal',
      'sell signal',
      'hold signal',
      'target price',
      'upside / (downside)',
      'strong buy'
    ];

    for (const phrase of bannedWords) {
      expect(lowerBody.includes(phrase), `Dossier body text unexpectedly contained banned phrase "${phrase}"`).toBe(false);
    }

    // Verify "Valuation" tab was removed from tab bar
    const tabLabels = await page.$$eval('button', (elements) => elements.map((el) => el.textContent?.trim()));
    expect(tabLabels.includes('Valuation')).toBe(false);

    // Verify "Strong / Mixed / Weak" verdict chip was removed from analysis header
    expect(lowerBody.includes('strong health')).toBe(false);
    expect(lowerBody.includes('weak health')).toBe(false);
    expect(lowerBody.includes('mixed health')).toBe(false);
  });

  test('Change B: plain valuation status chip in analysis section', async ({ page }) => {
    await page.goto('/company/NVDA');
    await page.waitForSelector('[data-testid="ai-analysis-section"]', { timeout: 15000 });

    const statusChip = page.locator('[data-testid="valuation-status-chip"]');
    await expect(statusChip).toBeVisible();

    const statusText = await statusChip.innerText();
    const validStatuses = ['Overvalued', 'Fairly valued', 'Undervalued', 'Not enough data'];
    expect(validStatuses).toContain(statusText);

    // Verify factual comparison line is present
    const container = page.locator('[data-testid="valuation-status-container"]');
    const containerText = await container.innerText();
    expect(containerText).toContain('Trading at');
    expect(containerText).toContain('5-year median');
    expect(containerText).toContain('peer median');

    // Verify non-recommendation disclaimer
    expect(containerText).toContain('Not a recommendation');

    // Capture screenshot of valuation status section
    await page.locator('[data-testid="ai-analysis-section"]').screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/valuation_status_chip.png'
    });
  });

  test('Change C: 5-year prediction model card rendered in hero slot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/company/NVDA');
    await page.waitForSelector('[data-testid="prediction-model-card"]', { timeout: 15000 });

    const card = page.locator('[data-testid="prediction-model-card"]');
    await expect(card).toBeVisible();

    // Verify Header and Reliability
    await expect(card.locator('text=Model projection · 5 years')).toBeVisible();
    await expect(card.locator('text=/Reliability: (High|Medium|Low)/')).toBeVisible();

    // Verify Horizon date
    await expect(card.locator('text=/by [A-Z][a-z]{2} 20[0-9]{2}/')).toBeVisible();

    // Verify Likely range 80% of simulations
    await expect(card.locator('text=/Likely range .* · 80% of simulations/')).toBeVisible();

    // Verify Always visible "Based on:" line
    const basedOnLine = card.locator('text=/Based on: news · financial health · sector competition · sector regulation · market cycle · peer valuation · legal rulings · public reviews · public attention · model reliability/');
    await expect(basedOnLine).toBeVisible();

    // Capture collapsed card screenshot
    await card.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/prediction_card_desktop.png'
    });

    // Verify Expandable breakdown
    const expandButton = card.locator('button:has-text("How this is predicted")');
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    // Verify table appears with the 10 factor rows
    const breakdown = page.locator('[data-testid="prediction-breakdown-panel"]');
    await expect(breakdown).toBeVisible();
    await expect(breakdown.locator('th:has-text("Factor")')).toBeVisible();
    await expect(breakdown.locator('th:has-text("What it measures")')).toBeVisible();
    await expect(breakdown.locator('th:has-text("Data source and date")')).toBeVisible();
    await expect(breakdown.locator('th:has-text("Current reading")')).toBeVisible();
    await expect(breakdown.locator('th:has-text("Effect on the projection")')).toBeVisible();

    // Verify assumptions summary
    await expect(breakdown.locator('text=Key model assumptions:')).toBeVisible();
    await expect(breakdown.locator('text=Exit multiple:')).toBeVisible();

    // Capture expanded card screenshot
    await card.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/prediction_card_expanded.png'
    });
  });

  test('Change A bottom section: Valuation models cards with Open model buttons', async ({ page }) => {
    await page.goto('/company/NVDA');
    const modelsSection = page.locator('#valuation-models-section');
    await expect(modelsSection).toBeVisible();

    // Verify cards say what the model is, status Available, and have Open model button
    await expect(modelsSection.locator('h3:has-text("Discounted Cash Flow")')).toBeVisible();
    await expect(modelsSection.locator('h3:has-text("Reverse DCF")')).toBeVisible();
    await expect(modelsSection.locator('h3:has-text("Relative Valuation")')).toBeVisible();

    const openButtons = modelsSection.locator('button:has-text("Open model")');
    expect(await openButtons.count()).toBeGreaterThanOrEqual(3);

    // Verify no intrinsic value output badges on the dossier
    const sectionText = await modelsSection.innerText();
    expect(sectionText.toLowerCase().includes('intrinsic value output')).toBe(false);

    // Capture bottom models screenshot
    await modelsSection.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/valuation_models_bottom.png'
    });
  });

  test('Mobile responsive view (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/company/NVDA');
    await page.waitForSelector('[data-testid="prediction-model-card"]', { timeout: 15000 });

    const card = page.locator('[data-testid="prediction-model-card"]');
    await expect(card).toBeVisible();

    await card.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/prediction_card_mobile.png'
    });
  });
});
