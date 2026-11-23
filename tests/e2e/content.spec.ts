import { expect, test } from "@playwright/test";
import { buildings } from "../../content/buildings";
import { credits, images } from "../../content/credits";
import { eras } from "../../content/eras";
import { sources } from "../../content/sources";

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

test("full references only appear in the sources areas; charts carry an in-text citation", async ({ page }) => {
  await page.goto("/read");
  await expect(page.getByText(/^Source:/)).toHaveCount(0);
  // No outside link to a source, and no full APA entry, anywhere above the reference lists.
  const strayLinks = await page.evaluate(
    (urls) =>
      [...document.querySelectorAll("main a")].filter(
        (a) =>
          urls.includes(a.getAttribute("href") ?? "") &&
          !a.closest("[data-reference-group]") &&
          a.textContent !== "Open the document",
      ).length,
    sources.filter((s) => /^https?:/.test(s.url)).map((s) => s.url),
  );
  expect(strayLinks).toBe(0);
  const chart = page.locator("#experts-vs-public [data-embedded-chart='experts-vs-public']");
  await expect(chart.getByRole("link", { name: "McClain et al., 2025" })).toHaveAttribute(
    "href",
    "/sources#mcclain-2025",
  );
});

test("round 5: buildings show their own charts as grouped bars with a table twin, not twice on the page", async ({
  page,
}) => {
  await page.goto("/read/the-future");
  const chart = page.locator("#experts-vs-public [data-embedded-chart='experts-vs-public']");
  await expect(chart.getByRole("list", { name: "Legend" })).toContainText("AI experts");
  await expect(chart.getByRole("list", { name: "Legend" })).toContainText("U.S. adults");
  // Paraphrase of several questions: a note, never a quoted "Question".
  await expect(chart.getByText("Note:", { exact: true })).toBeVisible();
  await expect(chart.getByText("Question:", { exact: true })).toHaveCount(0);
  await expect(chart).toContainText("5,410 U.S. adults");
  await chart.getByRole("button", { name: "Show table" }).click();
  const table = chart.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveText(["Measure", "AI experts", "U.S. adults"]);
  await expect(table.getByRole("row")).toHaveCount(6);
  await expect(page.locator("#training-lab [data-embedded-chart='shutdown-resistance']")).toContainText("93%");
  // Shown in its building, so the era's data band does not repeat it.
  const band = page.getByRole("region", { name: "The Future in numbers" });
  await expect(band.getByText("Are Americans more excited or more concerned about AI in daily life?")).toHaveCount(1);
  await expect(band.getByText("AI experts and U.S. adults: how they see AI")).toHaveCount(0);
  await expect(band.getByText(/Grok 4 resisted being shut down/)).toHaveCount(0);
});

test("reference lists show our essays' sources first, then the added ones", async ({ page }) => {
  const essay = sources.filter((s) => s.origin === "essay").length;
  await page.goto("/sources");
  const groups = page.locator("[data-reference-group]");
  await expect(groups.getByRole("heading")).toHaveText(["From our essays", "Added for the history"]);
  await expect(groups.nth(0).locator("li")).toHaveCount(essay);
  await expect(groups.nth(1).locator("li")).toHaveCount(sources.length - essay);
  await page.goto("/read/the-future");
  await expect(page.locator("#era-3-references [data-reference-group] h4").first()).toHaveText("From our essays");
});

test("round 5 comparison and the then-and-now buildings are on the page", async ({ page }) => {
  await page.goto("/read");
  await expect(page.getByText("What once appeared only in laboratory tests now shows up").first()).toBeVisible();
  for (const id of ["era-1-then-and-now", "era-2-then-and-now"]) await expect(page.locator(`#${id}`)).toBeVisible();
});

test("videos in the long-read: controls, loop, credited, and nothing downloads before play", async ({ page }) => {
  const asked: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(".mp4")) asked.push(r.url());
  });
  await page.goto("/read");
  await page.waitForLoadState("networkidle");
  for (const b of buildings.filter((x) => x.media?.videoSrc)) {
    const figure = page.locator(`#${b.id} [data-building-video]`);
    const video = figure.locator("video");
    await expect(video).toHaveAttribute("src", b.media!.videoSrc!);
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute("loop", "");
    await expect(figure).toContainText("made with Claude (Anthropic)");
  }
  expect(asked).toEqual([]);
  await page.goto("/about");
  await expect(page.getByText("made with Claude (Anthropic)")).toHaveCount(
    credits.filter((c) => c.kind === "video").length,
  );
});

test("every photo is shown with its credit line, and all are in the About credits", async ({ page }) => {
  test.skip(images.length === 0, "no photos yet");
  const credit = (imageId: string) => {
    const c = credits.find((x) => x.id === images.find((i) => i.id === imageId)!.creditId)!;
    return c.creditLine ?? c.author;
  };
  const used = [
    ...eras.flatMap((e) => e.anchorFigures.map((f) => f.imageId)),
    ...buildings.map((b) => b.media?.imageId),
  ].filter((x): x is string => Boolean(x));
  expect(used.length).toBe(images.length);
  await page.goto("/read");
  for (const id of used) await expect(page.locator("#main").getByText(credit(id)).first()).toBeVisible();
  await page.goto("/about");
  for (const id of used) await expect(page.getByText(credit(id)).first()).toBeVisible();
});
