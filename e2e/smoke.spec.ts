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

test('sign out, then sign in again with the demo code', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText('Welcome to Ymarq')).toBeVisible();

  await page.getByLabel('Phone number').fill('050-123-4567');
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('Code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Suzuki Swift')).toBeVisible();
});
