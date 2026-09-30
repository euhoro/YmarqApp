import { defineConfig, devices } from '@playwright/test';

// End-to-end smoke tests against the production web build (`npm run build:web` → dist/).
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npx serve -s dist -l 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
