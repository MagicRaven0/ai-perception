import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/read", "/read/the-past", "/read/the-jobs-era", "/read/the-future", "/listen", "/listen/episode-1", "/listen/episode-3", "/sources", "/about", "/explore"];

for (const route of ROUTES) {
  test(`no serious accessibility issues on ${route}`, async ({ page }) => {
    if (route === "/explore") {
      // The 2D fallback here (WebGL removed): the 3D world and its HUD are scanned in explore-3d.spec.ts, which
      // runs one software-WebGL world at a time; loading one here too would run it in parallel with those.
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (typeof type === "string" && type.startsWith("webgl")) return null;
          return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
        } as typeof HTMLCanvasElement.prototype.getContext;
      });
    }
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Next.js dev-only overlay is not part of the site
      .exclude("nextjs-portal")
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const report = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(report, report.join("\n")).toEqual([]);
  });
}

test("no serious accessibility issues with the chat panel open, in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/read");
  await page.getByRole("button", { name: "Ask the guide" }).click();
  await expect(page.getByRole("dialog", { name: "Research guide chat" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("nextjs-portal").analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const report = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(report, report.join("\n")).toEqual([]);
});
