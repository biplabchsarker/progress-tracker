import { defineConfig, devices } from '@playwright/test';

// Points at the app served by `docker compose up` (nginx on :8080). This
// suite doesn't manage the stack's lifecycle — start it yourself first:
//   docker compose up --build -d
//   npm run test:e2e
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
