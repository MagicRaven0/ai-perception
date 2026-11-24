import { expect, test } from "@playwright/test";

/** Full-page screenshots at phone and desktop width, saved to screenshots/ for review. */
const ROUTES = [
  "/",
  "/read",
  "/read/the-past",
  "/read/the-jobs-era",
  "/read/the-future",
  "/listen",
  "/sources",
  "/about",
];
const WIDTHS = [375, 1440];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`screenshot ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      // Reveal-on-scroll content: scroll through once so everything is shown
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
        window.scrollTo(0, 0);
      });
      // Nothing sticks out sideways (long chart labels, URLs, tables).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
      const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({ path: `screenshots/${name}-${width}.png`, fullPage: true });
    });
  }
}
