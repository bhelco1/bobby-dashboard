// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Generate timestamp: e.g. 2026-05-19_14-30-00
const now = new Date();
const timestamp = now.getFullYear()
  + '-' + String(now.getMonth() + 1).padStart(2, '0')
  + '-' + String(now.getDate()).padStart(2, '0')
  + '_' + String(now.getHours()).padStart(2, '0')
  + '-' + String(now.getMinutes()).padStart(2, '0')
  + '-' + String(now.getSeconds()).padStart(2, '0');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  retries: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: `test-results/${timestamp}/results.json` }],
    ['html',  { outputFolder: `test-results/${timestamp}/report`, open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  // Automatically start a local web server before tests run
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
