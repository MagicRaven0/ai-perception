import { expect, test as setup } from "@playwright/test";

/**
 * Warm-up (runs once before every other spec, see playwright.config.ts): the dev server compiles each route and
 * the 3D code on first request, which under Turbopack can take longer than a test's own waits. Visit every route
 * the specs use, and load the 3D world to "ready" once, so no test pays that first compile.
 */

const ROUTES = [
  "/",
  "/read",
  "/read/the-past",
  "/read/the-jobs-era",
  "/listen",
  "/listen/episode-1",
  "/sources",
  "/about",
];

setup.use({
  launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
});

setup("compile every route and the 3D world once", async ({ page }) => {
  setup.setTimeout(300_000);
  for (const route of ROUTES) {
    const res = await page.goto(route, { timeout: 120_000 });
    expect(res?.status(), route).toBeLessThan(500);
  }
  // A generous watchdog: this first load includes compiling the 3D code.
  await page.addInitScript(() => {
    (window as unknown as { __exploreLoadTimeoutMs: number }).__exploreLoadTimeoutMs = 240_000;
  });
  await page.goto("/explore?era=era-3", { timeout: 120_000 });
  const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
  if (!webgl2) return; // The 3D specs skip themselves without WebGL 2.
  await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "ready", {
    timeout: 240_000,
  });
});
