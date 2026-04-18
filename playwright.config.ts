import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  reporter: [["json", { outputFile: "uat/nopay-freelunch/playwright-results.json" }], ["list"]],
  use: {
    baseURL: "https://nopay-freelunch.vercel.app",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
