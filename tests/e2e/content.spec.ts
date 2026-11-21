import { expect, test } from "@playwright/test";

/**
 * Real content in 2D (22 Nov 2026): the two arcades work with the keyboard only and send nothing; each era page
 * ends with its references; in-text citations link to the works-cited entry.
 */

test("the predictions arcade works with the keyboard only", async ({ page }) => {
  await page.goto("/read/the-past");
  const arcade = page.locator("#predictions-arcade [data-arcade]");
  await arcade.getByRole("slider").focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(arcade.getByText(/The answer is 1997/)).toBeFocused();
  await arcade.getByRole("button", { name: "Try again" }).press("Enter");
  await expect(arcade.getByRole("slider")).toBeFocused();
});

test("the feelings arcade compares with the polls and stores or sends nothing", async ({ page }) => {
  await page.goto("/read/the-future");
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") sent.push(r.url());
  });
  const arcade = page.locator("#feelings-arcade [data-arcade]");
  await arcade.getByRole("slider").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(arcade.getByText(/^You: More concerned than excited/)).toBeFocused();
  await expect(arcade.getByRole("table")).toContainText("%");
  expect(sent).toEqual([]);
  // The answer is nowhere in storage or cookies (the site's own settings may be saved, the answer never).
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }) + document.cookie);
  expect(stored.toLowerCase()).not.toContain("concerned");
});

test("each era page ends with its references, and citations link to /sources", async ({ page }) => {
  for (const [slug, era] of [
    ["the-past", "era-1"],
    ["the-jobs-era", "era-2"],
    ["the-future", "era-3"],
  ]) {
    await page.goto(`/read/${slug}`);
    const refs = page.locator(`#${era}-references`);
    await expect(refs.getByRole("heading", { name: "References for this era" })).toBeVisible();
    expect(await refs.locator("li").count()).toBeGreaterThan(0);
  }
  await page.goto("/read/the-past");
  const cite = page.locator('a[href^="/sources#"]').first();
  const href = await cite.getAttribute("href");
  await cite.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator(href!.replace("/sources", ""))).toBeVisible();
});
