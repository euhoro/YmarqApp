import { expect, test } from '@playwright/test';

test('feed shows products and the header opens settings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Suzuki Swift')).toBeVisible(); // fake data source
  await expect(page.getByText('Nice car')).toBeVisible();
  await expect(page.getByLabel('Take photo')).toBeVisible();

  await page.getByLabel('Refresh').click();
  await expect(page.getByText('Suzuki Swift')).toBeVisible();

  await page.getByLabel('Settings').click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('deep link to sign-in works', async ({ page }) => {
  await page.goto('/sign-in');

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
