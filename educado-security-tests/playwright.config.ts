
import { defineConfig } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  retries: 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.API_URL,
    extraHTTPHeaders: {
      'Accept': 'application/json'
    },
    ignoreHTTPSErrors: false,
    trace: 'retain-on-failure'
  },

  timeout: 30000
});
