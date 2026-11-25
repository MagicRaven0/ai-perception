import { expect, test } from "@playwright/test";

/** Audio must keep playing while moving between pages (PLAN.md Phase 1 definition of done). */
test("audio keeps playing across route changes and the transcript seeks", async ({ page }) => {
  await page.goto("/listen");
  const play = page
    .getByRole("main")
    .getByRole("button", { name: /^(▶\s*)?Play$/ })
    .first();
  test.skip((await play.count()) === 0, "No recorded episode yet");

  // Open the first recorded episode (the one whose row has a Play button)
  const href = await play.locator("xpath=ancestor::li[1]").locator('a[href^="/listen/"]').getAttribute("href");
  await page.goto(href!);
  await page.getByRole("main").getByRole("button", { name: /Play/ }).first().click();

  const dock = page.getByRole("region", { name: "Audio player" });
  await expect(dock.getByRole("button", { name: "Pause" })).toBeVisible();

  // Click a transcript line: playback jumps there and the line is highlighted within 0.3 s
  const lines = page.getByRole("list", { name: "Transcript" }).getByRole("button");
  if ((await lines.count()) > 1) {
    await lines.nth(1).click();
    await expect(lines.nth(1)).toHaveAttribute("aria-current", "true", { timeout: 300 });
  }

  const time = async () =>
    (await dock.textContent())
      ?.match(/(\d+):(\d+)/)
      ?.slice(1)
      .map(Number) ?? [0, 0];
  const seconds = async () => {
    const [m, s] = await time();
    return m * 60 + s;
  };

  // /explore comes last: the 3D page has its own HUD instead of the site menu.
  for (const route of ["/read", "/about", "/listen", "/explore"]) {
    const before = await seconds();
    await page.getByRole("navigation", { name: "Main" }).locator(`a[href^="${route}"]`).click();
    await page.waitForURL(`**${route}*`);
    await page.waitForTimeout(1500);
    expect(await seconds(), `still playing after moving to ${route}`).toBeGreaterThan(before);
    await expect(dock.getByRole("button", { name: "Pause" })).toBeVisible();
  }
});
