import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks (PLAN.md tests/e2e): accessibility (axe), audio across routes, screenshots at 375/1440.
 * Runs against `npm run dev`, reusing a server that is already running on port 3000.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  // Capped: the 3D specs render with software WebGL (SwiftShader), which is CPU-heavy. With the default (half the
  // cores, 12 on a 24-core machine) parallel worlds starved each other and the dev server.
  workers: 3,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    // Compiles every route and the 3D code once before anything else runs (a cold Turbopack compile is slower
    // than the tests' own waits).
    { name: "warmup", testMatch: /warmup\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    // Plain pages and the no-WebGL /explore checks: light, fully parallel.
    {
      name: "chromium",
      testIgnore: /explore-3d\.spec\.ts/,
      dependencies: ["warmup"],
      use: { ...devices["Desktop Chrome"] },
    },
    // Every spec that renders the 3D world: ONE worker, so two software-WebGL worlds never load at the same time
    // (several at once starved each other and failed their load waits). Runs beside the light project.
    {
      name: "chromium-3d",
      testMatch: /explore-3d\.spec\.ts/,
      dependencies: ["warmup"],
      workers: 1,
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
