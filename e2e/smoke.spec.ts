import { expect, test } from '@playwright/test';

test('feed loads and navigates to settings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Products feed')).toBeVisible();

  await page.getByText('Settings', { exact: true }).click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('deep link to sign-in works', async ({ page }) => {
  await page.goto('/sign-in');

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
