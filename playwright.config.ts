import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks (PLAN.md tests/e2e): accessibility (axe), audio across routes, screenshots at 375/1440.
 * Runs against `npm run dev`, reusing a server that is already running on port 3000.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
