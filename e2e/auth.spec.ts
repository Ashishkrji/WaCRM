import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should allow user to login and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Assuming login page has these fields
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'securepassword');
    
    await page.click('button[type="submit"]');

    // Expect to be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Admin Control Center')).toBeVisible();
  });
});
