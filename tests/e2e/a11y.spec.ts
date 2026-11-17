import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/read", "/read/the-past", "/listen", "/listen/episode-1", "/sources", "/about", "/explore"];

for (const route of ROUTES) {
  test(`no serious accessibility issues on ${route}`, async ({ page }) => {
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
