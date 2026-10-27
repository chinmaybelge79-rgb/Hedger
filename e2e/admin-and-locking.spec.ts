import { test, expect } from '@playwright/test';

test.describe('Application Lock, 3 Users & GODDESS Admin Portal', () => {

  test('1. Application Lock Screen gates unauthenticated terminal access, fields empty, no 1-click bypass', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // Attempting to visit /markets without logging in
    await page.goto('http://localhost:5173/markets');
    await page.waitForLoadState('networkidle');

    // Should redirect to /signin with redirect param to proceed with task
    await expect(page).toHaveURL(/.*signin\?redirect=.*/);

    // Should display the Welcome Gate
    await expect(page.getByText('WELCOME TO HEDGER')).toBeVisible();
    await expect(page.getByText("LET'S START", { exact: true })).toBeVisible();
    await expect(page.getByText('proceed with your valuation task', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: "Let's Start →" })).toBeVisible();

    // Verify fields are completely empty - no prefilled email or password
    await expect(page.locator('input[type="email"]')).toHaveValue('');
    await expect(page.locator('input[type="password"]')).toHaveValue('');

    // Verify that one-click preset buttons are completely removed to protect accounts
    await expect(page.getByText('One-Click Provisioned Accounts')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Anusha (Ultra)' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Chinu (Plus)' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Founder (Ultra)' })).toHaveCount(0);

    // Verify no mention of old deprecated email
    await expect(page.getByText('medimianusha@gmail.com')).toHaveCount(0);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/app_locked_screen.png'
    });
  });

  test('2. Chinusha signs in manually with credentials, unlocks terminal with ULTRA tier', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto('http://localhost:5173/signin');
    await page.waitForLoadState('networkidle');

    // Sign in manually as Chinusha
    await page.locator('input[type="email"]').fill('chinusha@gmail.com');
    await page.locator('input[type="password"]').fill('Chinusha4love$$');
    await page.getByRole('button', { name: "Let's Start →" }).click();

    // Wait for redirect to /markets
    await page.waitForURL('**/markets', { timeout: 10000 });

    // Verify navbar initials show 'C' for Chinusha
    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText('C');

    // Hover profile menu to verify details and ULTRA tier
    await profileBtn.hover();
    await expect(page.getByText('Chinusha').first()).toBeVisible();
    await expect(page.getByText('chinusha@gmail.com').first()).toBeVisible();
    await expect(page.getByText('ULTRA', { exact: true }).first()).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/app_unlocked_anusha_ultra.png'
    });
  });

  test('3. Chinu signs in with credentials, unlocks terminal with PLUS tier', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto('http://localhost:5173/signin');
    await page.waitForLoadState('networkidle');

    // Sign in as Chinu
    await page.locator('input[type="email"]').fill('chinu@hedger.capital');
    await page.locator('input[type="password"]').fill('Live4Chinmay$$');
    await page.getByRole('button', { name: "Let's Start →" }).click();

    // Wait for redirect to /markets
    await page.waitForURL('**/markets', { timeout: 10000 });

    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText('C');

    await profileBtn.hover();
    await expect(page.getByText('Chinu').first()).toBeVisible();
    await expect(page.getByText('chinu@hedger.capital').first()).toBeVisible();
    await expect(page.getByText('PLUS', { exact: true }).first()).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/app_unlocked_chinu_plus.png'
    });
  });

  test('4. Administrative Portal: Login as GODDESS, monitor users, modify subscriptions, inspect audit trail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });

    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');

    // Verify Admin Login Screen
    await expect(page.getByText('Administrative Portal')).toBeVisible();
    await expect(page.getByText('Control Plane & Telemetry')).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/admin_portal_login.png'
    });

    // 1. Attempt invalid credentials
    await page.getByPlaceholder('GODDESS').fill('GODDESS');
    await page.getByPlaceholder('••••••••••••').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Authenticate as GODDESS →' }).click();
    await expect(page.getByText('Invalid administrative credentials')).toBeVisible();

    // 2. Submit valid credentials: GODDESS / Live4Anusha$$
    await page.getByPlaceholder('••••••••••••').fill('Live4Anusha$$');
    await page.getByRole('button', { name: 'Authenticate as GODDESS →' }).click();

    // 3. Verify Admin Control Plane renders
    await expect(page.getByText('HEDGER CONTROL PLANE')).toBeVisible();
    await expect(page.getByText('Superuser: GODDESS')).toBeVisible();
    await expect(page.getByText('Total Registered Users')).toBeVisible();

    // 4. Verify Chinusha and Chinu are listed in the surveillance table
    await expect(page.getByText('Chinusha').first()).toBeVisible();
    await expect(page.getByText('chinusha@gmail.com').first()).toBeVisible();
    await expect(page.getByText('Chinu').first()).toBeVisible();
    await expect(page.getByText('chinu@hedger.capital').first()).toBeVisible();
    await expect(page.getByText('medimianusha@gmail.com')).toHaveCount(0);

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/admin_portal_dashboard_users.png'
    });

    // 5. Test Modifying Subscription: Upgrade Chinu to ULTRA
    const chinuRow = page.locator('tr').filter({ hasText: 'chinu@hedger.capital' });
    await expect(chinuRow).toBeVisible();
    await chinuRow.getByRole('button', { name: 'ultra' }).click();

    // Verify confirmation feedback
    await expect(page.getByText('Updated subscription for Chinu to ULTRA')).toBeVisible();

    // Degrade Chinu back to PLUS
    await chinuRow.getByRole('button', { name: 'plus' }).click();
    await expect(page.getByText('Updated subscription for Chinu to PLUS')).toBeVisible();

    // 6. Test User Steps & Audit Telemetry Tab
    await page.getByRole('button', { name: /User Steps & Audit Telemetry/ }).click();
    await expect(page.getByText('Granular surveillance trail')).toBeVisible();
    await expect(page.getByText('ADMIN_SUBSCRIPTION_OVERRIDE').first()).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/admin_portal_audit_telemetry.png'
    });

    // 7. Test Live Active Sessions Tab
    await page.getByRole('button', { name: /Live Active Sessions/ }).click();
    await expect(page.getByText('Live authenticated session tokens')).toBeVisible();
  });

  test('5. Attempting specific task (/company/NVDA) redirects to signin with target task and unlocks directly upon manual login', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // Unauthenticated user attempts valuation task on NVDA
    await page.goto('http://localhost:5173/company/NVDA');
    await page.waitForLoadState('networkidle');

    // Should redirect to signin with redirect target
    await expect(page).toHaveURL(/.*signin\?redirect=%2Fcompany%2FNVDA/);
    await expect(page.getByText('WELCOME TO HEDGER')).toBeVisible();
    await expect(page.getByText("LET'S START", { exact: true })).toBeVisible();
    await expect(page.getByText('proceed with your valuation task', { exact: false })).toBeVisible();

    // Manually enter credentials for chinusha@gmail.com
    await page.locator('input[type="email"]').fill('chinusha@gmail.com');
    await page.locator('input[type="password"]').fill('Chinusha4love$$');
    await page.getByRole('button', { name: "Let's Start →" }).click();

    // Verify user is redirected directly to the requested task: /company/NVDA
    await page.waitForURL('**/company/NVDA', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'NVIDIA Corporation', exact: true })).toBeVisible();

    await page.screenshot({
      path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/task_redirect_unlocked_nvda.png'
    });
  });
});
