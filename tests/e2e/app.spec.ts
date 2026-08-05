import { test, expect } from '@playwright/test';

test.describe('OnDray CRM Authentication and Workflow', () => {
  test('handles authentication based on VITE_AUTH_MODE', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    const authMode = process.env.VITE_AUTH_MODE || 'required';

    if (authMode === 'auto_demo') {
      // 1. Should bypass login and show staging demo badge
      await expect(page.getByText('Staging Demo Session')).toBeVisible({ timeout: 15000 });
      
      // 2. Should provision demo workspace and show account
      await expect(page.getByText('OnDray Demo Customer')).toBeVisible({ timeout: 15000 });

      // 3. Test basic persistence (Bill-to Code)
      // Since it's a demo workspace, we can interact with it
      // For now, just verifying the UI loaded successfully
      await expect(page.getByText('Kanban Pipeline')).toBeVisible();

    } else {
      // 1. Should require login
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
    }
  });
});
