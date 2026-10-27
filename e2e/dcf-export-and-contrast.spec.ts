import { test, expect } from '@playwright/test';

async function signIn(page: any) {
  await page.goto('http://localhost:5173/signin');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('chinusha@gmail.com');
  await page.locator('input[type="password"]').fill('Chinusha4love$$');
  await page.getByRole('button', { name: "Let's Start →" }).click();
  await page.waitForURL('**/markets', { timeout: 10000 });
}

test.describe('DCF Top-Right Header Export & Save Contrast Verification', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('Export Model button and Save Model button render with crisp text contrast and functioning export formats', async ({ page }) => {
    // 1. Navigate to NVDA DCF Model page
    await page.goto('http://localhost:5173/models/dcf/NVDA');
    await page.waitForLoadState('networkidle');

    // Wait for the assumptions panel and header to load
    await expect(page.locator('aside[aria-label="Valuation Assumptions Sidebar"]')).toBeVisible({ timeout: 10000 });

    // 2. Locate Export Model button
    const exportBtn = page.locator('[data-testid="dcf-export-btn"]');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Export Model');

    // Verify button text is clearly legible (not white on white)
    const exportBtnColors = await exportBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bg: style.backgroundColor,
        color: style.color
      };
    });
    expect(exportBtnColors.bg).not.toBe(exportBtnColors.color);

    // 3. Locate Save Model button
    const saveBtn = page.locator('[data-testid="dcf-save-model-btn"]');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('Save Model');

    const saveBtnColors = await saveBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bg: style.backgroundColor,
        color: style.color
      };
    });
    expect(saveBtnColors.bg).not.toBe(saveBtnColors.color);

    // 4. Click Export Model button to open dropdown
    await exportBtn.click();
    const exportMenu = page.locator('[data-testid="dcf-export-menu"]');
    await expect(exportMenu).toBeVisible();
    await expect(exportMenu.getByText('Excel / CSV Spreadsheet')).toBeVisible();
    await expect(exportMenu.getByText('Institutional PDF Report')).toBeVisible();
    await expect(exportMenu.getByText('JSON Quantitative Dossier')).toBeVisible();

    // 5. Take screenshot of the top right header with opened Export dropdown
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_export_menu_contrast.png'
    });

    // 6. Test CSV Export click and toast
    const [download] = await Promise.all([
      page.waitForEvent('download').catch(() => null),
      page.locator('[data-testid="export-dcf-csv"]').click()
    ]);
    const toast = page.locator('text=Exported NVDA DCF Model to CSV');
    await expect(toast).toBeVisible();

    // 7. Click Save Model button to verify the Save Modal contrast
    await saveBtn.click();
    const saveModal = page.locator('text=Save DCF Valuation Model');
    await expect(saveModal).toBeVisible();

    const confirmSaveBtn = page.locator('button:has-text("Confirm Save")');
    await expect(confirmSaveBtn).toBeVisible();
    const confirmColors = await confirmSaveBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bg: style.backgroundColor,
        color: style.color
      };
    });
    expect(confirmColors.bg).not.toBe(confirmColors.color);

    // Capture screenshot of Save Modal with properly contrasting Confirm Save button
    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/dcf_save_modal_contrast.png'
    });

    // Click Cancel to cleanly dismiss modal
    await page.locator('button:has-text("Cancel")').click();
    await expect(saveModal).not.toBeVisible();
  });
});
