// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Timestamp comes from deploy.sh via TEST_TIMESTAMP env var.
// Falls back to generating one now if run manually via `npm test`.
function makeTimestamp() {
  const now = new Date();
  return now.getFullYear()
    + '-' + String(now.getMonth() + 1).padStart(2, '0')
    + '-' + String(now.getDate()).padStart(2, '0')
    + '_' + String(now.getHours()).padStart(2, '0')
    + '-' + String(now.getMinutes()).padStart(2, '0')
    + '-' + String(now.getSeconds()).padStart(2, '0');
}

const timestamp = process.env.TEST_TIMESTAMP || makeTimestamp();

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
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
