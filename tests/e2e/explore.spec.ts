import { expect, test, type Page } from "@playwright/test";

/**
 * /explore without WebGL (Phase 3): the capability gate and the 2D fallback. These render no 3D world, so they
 * run in parallel with the other plain-page specs. Everything that renders the 3D world is in
 * explore-3d.spec.ts (its own Playwright project, one world at a time: see playwright.config.ts).
 */

const STATES = ["fallback", "choose", "loading", "ready"];

async function exploreState(page: Page) {
  return page.locator("[data-explore-state]").getAttribute("data-explore-state");
}

test.describe("explore without WebGL", () => {
  test.beforeEach(async ({ page }) => {
    // Deterministically remove WebGL: every getContext("webgl*") returns null.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === "string" && type.startsWith("webgl")) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
  });

  test("the page loads and the skip link to reading mode comes first", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("[data-explore-state]")).toHaveAttribute(
      "data-explore-state",
      /fallback|choose|loading|ready/,
    );
    expect(STATES).toContain(await exploreState(page));
    await page.keyboard.press("Tab");
    const first = page.locator(":focus");
    await expect(first).toHaveText("Go to reading mode");
    await expect(first).toHaveAttribute("href", /^\/read\//);
  });

  test("with WebGL disabled the 2D fallback appears", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "fallback");
    await expect(page.getByRole("heading", { name: "Reading mode" })).toBeVisible();
    await expect(page.getByText("WebGL 2 is not available")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read in 2D" })).toHaveAttribute("href", "/read");
    await expect(page.getByRole("button", { name: "Try 3D anyway" })).toBeVisible();
    // No 3D code ran: there is no canvas.
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("reduced motion lands in reading mode with a reason", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/explore");
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "fallback");
    await expect(page.getByText("Your system asks for reduced motion.")).toBeVisible();
  });

  test("a failed 'Try 3D anyway' is remembered: Back and the Explore link show reading mode again", async ({
    page,
  }) => {
    await page.goto("/explore");
    await page.getByRole("button", { name: "Try 3D anyway" }).click();
    await expect(page).toHaveURL(/\/read(\/|$)/, { timeout: 15_000 });
    await expect(page.getByText("3D stopped, switched to reading mode")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/explore/, { timeout: 15_000 });
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "fallback");
    await expect(page.getByText("stopped working on this device")).toBeVisible();

    await page.goto("/read");
    await page.getByRole("link", { name: "Explore", exact: true }).first().click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 15_000 });
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "fallback");
    await expect(page.getByRole("button", { name: "Try 3D anyway" })).toBeVisible();
  });
});
