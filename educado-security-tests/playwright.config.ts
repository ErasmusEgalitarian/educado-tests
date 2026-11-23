
import { defineConfig } from '@playwright/test';
import 'dotenv/config';

const apiUrl = process.env.API_URL;
if (!apiUrl) {
  throw new Error('Configure API_URL para a API local antes de executar os testes.');
}

let apiHost: string;
try {
  apiHost = new URL(apiUrl).hostname;
} catch {
  throw new Error('API_URL deve ser uma URL válida de uma API local.');
}

if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(apiHost)) {
  throw new Error('Execução bloqueada: a suíte só pode apontar para API local em loopback.');
}

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
    baseURL: apiUrl,
    extraHTTPHeaders: {
      'Accept': 'application/json'
    },
    ignoreHTTPSErrors: false,
    trace: 'retain-on-failure'
  },

  timeout: 30000
});
