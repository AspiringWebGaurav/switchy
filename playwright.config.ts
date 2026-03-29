import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  timeout: 30000,
  retries: 1,
  workers: 1,
  globalSetup: "./playwright/global-setup.ts",
  globalTeardown: "./playwright/global-teardown.ts",
  reporter: [["list"], ["json", { outputFile: "playwright-results.json" }]],
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
