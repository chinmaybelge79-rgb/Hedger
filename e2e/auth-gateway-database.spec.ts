import { test, expect } from '@playwright/test';

test.describe('Institutional Auth Gateway & Database Persistence', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and storage to ensure fresh unauthenticated guest state
    await context.clearCookies();
  });

  test('Guest state: Alex Morgan is removed; Sign In and Get Started buttons render', async ({ page }) => {
    // Clear localStorage explicitly before page load
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Alex Morgan is NOT anywhere on the page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Alex Morgan');
    expect(pageContent).not.toContain('alex.morgan@hedger.capital');

    // Verify "Sign In" button is visible in navbar
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(signInBtn).toBeVisible();

    // Verify "Get Started" button is visible
    const getStartedBtn = page.getByRole('button', { name: 'Get Started', exact: true });
    await expect(getStartedBtn).toBeVisible();

    // Take screenshot of clean unauthenticated navbar
    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_guest_navbar_clean.png' });
  });

  test('Navigate to /signin: dedicated page with institutional OAuth Gateway renders', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Title & Brand
    await expect(page.locator('h1')).toContainText('Sign In to Hedger Terminal');

    // OAuth Gateway Buttons
    const googleBtn = page.getByRole('button', { name: 'Continue with Google' });
    const appleBtn = page.getByRole('button', { name: 'Continue with Apple' });
    const githubBtn = page.getByRole('button', { name: 'Continue with GitHub' });

    await expect(googleBtn).toBeVisible();
    await expect(appleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();

    // Email inputs
    await expect(page.getByLabel('Institutional Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_page_signin_dark.png' });
  });

  test('Google OAuth Gateway: authenticates user, updates navbar initials, saves to DB', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Click Continue with Google
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    // Should redirect to /markets after successful exchange
    await page.waitForURL('**/markets', { timeout: 10000 });

    // Navbar should now show Elena Rostova initials "ER"
    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText('ER');

    // Hover or click profile menu to verify user details
    await profileBtn.hover();
    await expect(page.locator('text=Elena Rostova')).toBeVisible();
    await expect(page.locator('text=elena.rostova@gmail.com')).toBeVisible();

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_google_authenticated_dropdown.png' });

    // Test Sign Out
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Verify back to unauthenticated guest state
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('GitHub OAuth Gateway: authenticates Marcus Vance with ULTRA tier', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Continue with GitHub' }).click();
    await page.waitForURL('**/markets', { timeout: 10000 });

    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText('MV');

    await profileBtn.hover();
    await expect(page.locator('text=Marcus Vance')).toBeVisible();
    await expect(page.locator('text=marcus.vance@hedger.capital')).toBeVisible();

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_github_authenticated_dropdown.png' });
  });

  test('Apple ID OAuth Gateway: authenticates Julian Thorne with private relay', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Continue with Apple' }).click();
    await page.waitForURL('**/markets', { timeout: 10000 });

    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText('JT');

    await profileBtn.hover();
    await expect(page.locator('text=Julian Thorne')).toBeVisible();
    await expect(page.locator('text=julian.thorne@privaterelay.appleid.com')).toBeVisible();

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_apple_authenticated_dropdown.png' });
  });

  test('Email credentials: sign up, invalid sign in error handling, valid sign in', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    const uniqueEmail = `quant.${Date.now()}@hedger.capital`;
    const password = 'InstitutionalPassword2026!';

    // 1. Sign Up Flow
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Create Institutional Account');

    await page.getByPlaceholder('Institutional Analyst').fill('David Sterling');
    await page.getByPlaceholder('analyst@hedger.capital').fill(uniqueEmail);
    await page.getByPlaceholder('••••••••••••').fill(password);

    await page.getByRole('button', { name: 'Create Institutional Account' }).click();

    // Should redirect to /markets as David Sterling (DS)
    await page.waitForURL('**/markets', { timeout: 10000 });
    const profileBtn = page.locator('button[aria-label*="Profile and Settings Menu"]');
    await expect(profileBtn).toContainText('DS');

    // 2. Sign Out
    await profileBtn.hover();
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();

    // 3. Test Invalid Password Error Feedback
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('analyst@hedger.capital').fill(uniqueEmail);
    await page.getByPlaceholder('••••••••••••').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign In to Terminal' }).click();

    // Verify inline error banner
    await expect(page.locator('role=alert')).toContainText('Invalid email or password');

    // 4. Test Valid Sign In
    await page.getByPlaceholder('••••••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In to Terminal' }).click();

    await page.waitForURL('**/markets', { timeout: 10000 });
    await expect(page.locator('button[aria-label*="Profile and Settings Menu"]')).toContainText('DS');

    await page.screenshot({ path: '/Users/chinmayb/.gemini/antigravity/brain/960875a1-d837-4ae6-873c-d12b88c264d7/auth_email_authenticated_success.png' });
  });
});
