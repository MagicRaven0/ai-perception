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
