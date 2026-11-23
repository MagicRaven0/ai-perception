import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { buildings } from "../../content/buildings";
import { site } from "../../content/site";

/**
 * /explore in 3D (Phase 3): the ?b= deep link into a building drawer, driving, failure handling, leaving /
 * coming back (Next keeps /explore mounted but hidden after a navigation), the load watchdog and the phone HUD.
 * The tests need WebGL 2 in headless Chromium (SwiftShader). They skip ONLY when the browser has no WebGL 2
 * at all; when it does, /explore must reach "ready" or the test fails.
 *
 * Software WebGL is CPU-heavy: this file runs in its own Playwright project with ONE worker (playwright.config.ts),
 * after a warm-up that has compiled every route and the 3D code once (warmup.setup.ts), so worlds never load in
 * parallel and no test pays the first Turbopack compile.
 */

// Software WebGL in headless Chromium (the no-WebGL tests stub it out anyway).
test.use({
  launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
});

/** Skips when this browser has no WebGL 2; otherwise opens `url` and requires the 3D world to be ready. */
async function open3d(page: Page, url: string) {
  await page.goto(url);
  const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
  test.skip(!webgl2, "this browser has no WebGL 2");
  await expectReady(page);
}

/**
 * How long a test waits for "ready": longer than the relaxed 45 s test watchdog below, so a slow software-WebGL
 * load ends in either "ready" or the watchdog's own fallback, never in a test-side timeout first.
 */
const READY_TIMEOUT = 60_000;

function expectReady(page: Page) {
  return expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "ready", {
    timeout: READY_TIMEOUT,
  });
}

type Debug = {
  __explore: {
    player: { x: number; z: number; heading: number };
    gl: { getContext: () => WebGL2RenderingContext };
  };
  __store: { getState: () => { nearbyBuildingId: string | null; openBuildingId: string | null } };
};

const playerPose = (page: Page) =>
  page.evaluate(() => {
    const p = (window as unknown as Debug).__explore.player;
    return { x: p.x, z: p.z, heading: p.heading };
  });

/** The extra HUD buttons fold behind "More controls"; open it if needed. */
async function expandHud(page: Page) {
  const more = page.getByRole("button", { name: "More controls" });
  if (await more.isVisible()) await more.click();
}

/** Visible dialogs only (the hidden /explore page stays in the DOM after leaving). */
const visibleDialogs = (page: Page) => page.getByRole("dialog");

/**
 * Software WebGL is CPU-heavy, and several workers may load worlds at once: give the load watchdog more than
 * its real 20 s (LOAD_TIMEOUT_MS; development-only hook) so a busy CPU is not reported as a broken device. The real limit has
 * its own test below.
 */
async function relaxLoadWatchdog(page: Page) {
  await page.addInitScript(() => {
    // These browsers draw with software WebGL, but the tests are about the normal world (see capabilities.ts).
    (window as unknown as { __exploreAssumeHardware: boolean }).__exploreAssumeHardware = true;
    (window as unknown as { __exploreLoadTimeoutMs: number }).__exploreLoadTimeoutMs = 45_000;
  });
}

test.describe("explore in 3D", () => {
  // Run the 3D tests in this file one after another (the project also has a single worker).
  test.describe.configure({ mode: "default" });
  test.setTimeout(150_000);
  test.beforeEach(async ({ page }) => {
    await relaxLoadWatchdog(page);
  });

  test("driver's view: the eye button and V switch cameras, and the car changes with the era", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?era=era-1");
    const cameraMode = () =>
      page.evaluate(
        () =>
          (window as unknown as { __store: { getState: () => { cameraMode: string } } }).__store.getState().cameraMode,
      );

    await expandHud(page);
    const eye = page.getByRole("button", { name: /Driver's view/ });
    await expect(eye).toHaveAttribute("aria-pressed", "false");
    await eye.click();
    await expect(eye).toHaveAttribute("aria-pressed", "true");
    expect(await cameraMode()).toBe("driver");
    await page.locator("body").press("v");
    await expect(eye).toHaveAttribute("aria-pressed", "false");
    expect(await cameraMode()).toBe("iso");

    // 360° overview: Q turns the view 45° each press (orbit target lives on the dev-only __explore hook).
    const orbitTarget = () =>
      page.evaluate(() => (window as unknown as { __explore: { orbit: { target: number } } }).__explore.orbit.target);
    const before = await orbitTarget();
    await page.locator("body").press("q");
    await page.locator("body").press("q");
    expect(await orbitTarget()).toBeCloseTo(before + Math.PI / 2, 5);

    // Fast travel to The Future: the era follows (the car's look is driven by it) and the world keeps rendering.
    await page.getByRole("button", { name: "The Future" }).first().click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __store: { getState: () => { activeEra: string } } }).__store.getState().activeEra,
        ),
      )
      .toBe("era-3");
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "ready");
  });

  test("click a spot on the island and the car drives there by itself", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?era=era-1");
    type Dbg = {
      __explore: { autoDrive: { active: boolean; x: number; z: number }; player: { x: number; z: number } };
    };
    const state = () =>
      page.evaluate(() => {
        const e = (window as unknown as Dbg).__explore;
        return { active: e.autoDrive.active, tx: e.autoDrive.x, tz: e.autoDrive.z, x: e.player.x, z: e.player.z };
      });
    // Click a little way from the screen centre (the car is near the centre, on the island).
    const box = (await page.locator("canvas").first().boundingBox())!;
    await page.mouse.click(box.x + box.width / 2 + 140, box.y + box.height / 2 + 60);
    const s0 = await state();
    expect(s0.active).toBe(true);
    const d0 = Math.hypot(s0.tx - s0.x, s0.tz - s0.z);
    await expect
      .poll(
        async () => {
          const s = await state();
          return !s.active || Math.hypot(s.tx - s.x, s.tz - s.z) < d0 - 2;
        },
        { timeout: 20_000 },
      )
      .toBe(true);
    // Any driving key takes over.
    await page.mouse.click(box.x + box.width / 2 - 140, box.y + box.height / 2 + 60);
    await page.keyboard.down("KeyW");
    await page.keyboard.up("KeyW");
    expect((await state()).active).toBe(false);
  });

  test("drive off a runway to fly as the era's plane, then L lands back on a runway", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?era=era-1");
    type Dbg = {
      __explore: {
        player: { flying: boolean; y: number };
        requestTeleport: (p: { x: number; y: number; z: number; heading: number }) => void;
      };
      __store: { getState: () => { flying: boolean } };
    };
    // Put the car near the open end of The Past's runway (it points west, -x), facing off the end.
    await page.evaluate(() => {
      const d = window as unknown as Dbg;
      // The Past: centre (-154, 6), radius 64, runway west: rim at x = -218, open end ~46 m further.
      d.__explore.requestTeleport({ x: -250, y: 1.2, z: 6, heading: -Math.PI / 2 });
    });
    await page.keyboard.down("KeyW");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Dbg).__store.getState().flying), { timeout: 20_000 })
      .toBe(true);
    await page.keyboard.up("KeyW");
    await expect(page.getByRole("button", { name: /Land/ })).toBeVisible();
    await page.keyboard.press("KeyL");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Dbg).__store.getState().flying), { timeout: 10_000 })
      .toBe(false);
    await expect(page.getByRole("button", { name: /Land/ })).toHaveCount(0);
  });

  test("?b= deep link drives to the building and opens its drawer", async ({ page }) => {
    const target = [...buildings].sort((a, b) => a.eraId.localeCompare(b.eraId) || a.order - b.order)[0];
    test.skip(!target, "no buildings in content yet");
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, `/explore?b=${target!.id}`);

    const drawer = visibleDialogs(page);
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByRole("link", { name: "Read more" })).toHaveAttribute(
      "href",
      new RegExp(`/read/[a-z0-9-]+#${target!.id}$`),
    );
    expect(page.url()).toContain(`b=${target!.id}`);
    // The dialog's name never reads out authoring text ("Placeholder: ..." / "TODO:").
    expect(await drawer.getAttribute("aria-label").then((l) => l ?? "")).not.toMatch(/placeholder|TODO/i);
    await expect(drawer).toHaveAccessibleName(/\S/);
    await expect(drawer).not.toHaveAccessibleName(/placeholder|TODO/i);

    // Escape closes it and the URL forgets the building. A deep link had no opener: focus goes to the
    // prompt's Open button (the car is still parked at the building), not back to the top of the page.
    const prompt = page.getByRole("button", { name: /^E\s*Open/ });
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.get("b")).toBeNull();
    await expect(prompt).toBeFocused();
    await prompt.blur();

    // The car is still parked in the building's sensor: the prompt shows, but nothing opens by itself.
    await page.waitForTimeout(1000);
    await expect(drawer).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Debug).__store.getState().nearbyBuildingId))
      .toBe(target!.id);
    await expect(prompt).toBeVisible();
    // E opens it, and the URL is shareable again.
    await page.keyboard.press("e");
    await expect(drawer).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get("b")).toBe(target!.id);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // Opening from the prompt's button with the keyboard returns focus to that button on close.
    await prompt.focus();
    await page.keyboard.press("Enter");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(prompt).toBeFocused();

    // Escape also works after focus left the drawer (clicked the world behind it).
    await page.goto(`/explore?b=${target!.id}`);
    await expect(drawer).toBeVisible({ timeout: READY_TIMEOUT });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // The HUD is there: fast travel, minimap, progress.
    await expect(page.getByRole("navigation", { name: "Fast travel" }).first()).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+/).first()).toBeVisible();
    await page.screenshot({ path: "screenshots/explore-1440.png" });
  });

  test("the car drives with the keyboard (W / arrows) and the skip link comes first", async ({ page }) => {
    await open3d(page, "/explore?era=era-1");
    await page.keyboard.press("Tab");
    const first = page.locator(":focus");
    await expect(first).toHaveText("Go to reading mode");
    await expect(first).toHaveAttribute("href", /^\/read\//);
    await first.blur();

    const start = await playerPose(page);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyW");
    const moved = await playerPose(page);
    expect(Math.hypot(moved.x - start.x, moved.z - start.z)).toBeGreaterThan(3);

    await page.keyboard.down("ArrowUp");
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(1200);
    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowUp");
    const turned = await playerPose(page);
    expect(Math.abs(turned.heading - moved.heading)).toBeGreaterThan(0.3);
  });

  test("leaving /explore tears the 3D down, and coming back builds a fresh world without a stale drawer", async ({
    page,
  }) => {
    const target = buildings[0];
    test.skip(!target, "no buildings in content yet");
    await open3d(page, `/explore?b=${target!.id}`);
    await expect(visibleDialogs(page)).toBeVisible({ timeout: 15_000 });

    // Read more -> /read: no canvas left running, no false "3D stopped" toast.
    await visibleDialogs(page).getByRole("link", { name: "Read more" }).click();
    // A dev-server navigation under software WebGL can take a while when several workers share the CPU.
    await expect(page).toHaveURL(/\/read\//, { timeout: 15_000 });
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.waitForTimeout(1000);
    await expect(page.getByText("3D stopped, switched to reading mode")).toHaveCount(0);

    // Back to /explore with the site nav: a live world, no drawer left open, nothing nearby from before.
    await page.getByRole("link", { name: "Explore", exact: true }).first().click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 15_000 });
    await expectReady(page);
    await expect(visibleDialogs(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as Debug).__store.getState().openBuildingId)).toBeNull();
    expect(await page.evaluate(() => (window as unknown as Debug).__explore.gl.getContext().isContextLost())).toBe(
      false,
    );
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`HUD, drawer and options have no serious accessibility issues (${scheme})`, async ({ page }) => {
      const target = buildings[0];
      test.skip(!target, "no buildings in content yet");
      await page.emulateMedia({ colorScheme: scheme });
      await open3d(page, `/explore?b=${target!.id}`);
      await expect(visibleDialogs(page)).toBeVisible({ timeout: 15_000 });
      // The 3D page has a main landmark and a heading for screen readers.
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1, name: "Explore the islands" })).toHaveCount(1);

      const scan = async () => {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .exclude("nextjs-portal")
          .analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        return serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      };
      expect(await scan()).toEqual([]);

      await page.keyboard.press("Escape");
      await expandHud(page);
      await page.getByRole("button", { name: "Options" }).click();
      await expect(page.getByRole("dialog", { name: "Options" })).toBeVisible();
      expect(await scan()).toEqual([]);
    });
  }

  test("losing the WebGL context switches to reading mode, and Back offers 3D again", async ({ page }) => {
    await open3d(page, "/explore?era=era-2");
    // ?era= spawned on The Jobs Era and was dropped from the URL.
    await expect(
      page.getByRole("navigation", { name: "Fast travel" }).getByRole("button", { name: "The Jobs Era" }),
    ).toHaveAttribute("aria-current", "location");
    await expect.poll(() => new URL(page.url()).searchParams.get("era")).toBeNull();

    await page.evaluate(() =>
      (window as unknown as Debug).__explore.gl.getContext().getExtension("WEBGL_lose_context")?.loseContext(),
    );
    await expect(page.getByText("3D stopped, switched to reading mode")).toBeVisible();
    await expect(page).toHaveURL(/\/read(\/|$)/, { timeout: 15_000 });
    await expect(page.locator("canvas")).toHaveCount(0);

    // Back: never a dead canvas. The reading-mode screen explains what happened and offers 3D again.
    await page.goBack();
    await expect(page).toHaveURL(/\/explore/, { timeout: 15_000 });
    await expect(page.locator("[data-explore-state]")).toHaveAttribute("data-explore-state", "fallback");
    await expect(page.getByText("stopped working on this device")).toBeVisible();
    await page.getByRole("button", { name: "Try 3D anyway" }).click();
    await expectReady(page);
    expect(await page.evaluate(() => (window as unknown as Debug).__explore.gl.getContext().isContextLost())).toBe(
      false,
    );
  });

  test("one HUD dialog at a time: Options closes the drawer, a building closes Options", async ({ page }) => {
    const target = buildings[0];
    test.skip(!target, "no buildings in content yet");
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, `/explore?b=${target!.id}`);
    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 15_000 });

    // Mouse click on Options with the drawer open: the drawer closes, Options is the only dialog.
    await expandHud(page);
    const options = page.getByRole("button", { name: "Options" });
    await options.click();
    await expect(page.getByRole("dialog", { name: "Options" })).toBeVisible();
    await expect(visibleDialogs(page)).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as Debug).__store.getState().openBuildingId)).toBeNull();
    await page.keyboard.press("Escape");
    await expect(visibleDialogs(page)).toHaveCount(0);
    await expect(options).toBeFocused();

    // A building opening while Options is open closes Options.
    await options.click();
    await expect(page.getByRole("dialog", { name: "Options" })).toBeVisible();
    await page.evaluate(
      (id) =>
        (window as unknown as { __store: { getState: () => { openBuilding: (id: string) => void } } }).__store
          .getState()
          .openBuilding(id),
      target!.id,
    );
    await expect(page.getByRole("dialog", { name: "Options" })).toHaveCount(0);
    await expect(visibleDialogs(page)).toHaveCount(1);
  });

  test("a background tab never counts as a 3D failure: loading waits until the tab is visible", async ({ page }) => {
    // Chrome in a background tab: document.hidden is true and requestAnimationFrame never fires (timers do).
    await page.addInitScript(() => {
      const realRaf = window.requestAnimationFrame.bind(window);
      let hidden = true;
      const queued: FrameRequestCallback[] = [];
      Object.defineProperty(Document.prototype, "hidden", { configurable: true, get: () => hidden });
      Object.defineProperty(Document.prototype, "visibilityState", {
        configurable: true,
        get: () => (hidden ? "hidden" : "visible"),
      });
      window.requestAnimationFrame = (cb) => {
        if (!hidden) return realRaf(cb);
        queued.push(cb);
        return 0;
      };
      (window as unknown as { __unhide: () => void }).__unhide = () => {
        hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
        queued.splice(0).forEach((cb) => realRaf(cb));
      };
    });
    // A deliberately short TEST-ONLY limit of 10 s while hidden (the real LOAD_TIMEOUT_MS is 20 s; a shorter limit
    // keeps the wait below short): if hidden time counted, this would fire. This init script runs after the relaxed one.
    await page.addInitScript(() => {
      (window as unknown as { __exploreLoadTimeoutMs: number }).__exploreLoadTimeoutMs = 10_000;
    });
    await page.goto("/explore?era=era-2");
    const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!webgl2, "this browser has no WebGL 2");
    const state = page.locator("[data-explore-state]");
    await expect(state).toHaveAttribute("data-explore-state", "loading", { timeout: 15_000 });
    // The 3D code arrives and the canvas mounts, but a hidden tab never draws a frame.
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 30_000 });

    // Longer than the 10 s test-only limit: still loading, no toast, no failure remembered.
    await page.waitForTimeout(12_000);
    await expect(state).toHaveAttribute("data-explore-state", "loading");
    expect(page.url()).toContain("/explore");
    expect(await page.evaluate(() => sessionStorage.getItem("explore-3d-failed"))).toBeNull();
    await expect(page.getByText("3D stopped, switched to reading mode")).toHaveCount(0);

    // Back in the foreground: the world finishes loading (relaxed limit again: a busy CPU is not a failure).
    await page.evaluate(() => {
      (window as unknown as { __exploreLoadTimeoutMs: number }).__exploreLoadTimeoutMs = 45_000;
      (window as unknown as { __unhide: () => void }).__unhide();
    });
    await expectReady(page);
  });

  test("audio keeps playing while driving and after leaving /explore for /read", async ({ page }) => {
    // No episode is recorded yet: play a generated 60 s silent WAV through the real audio engine and dock.
    const rate = 8000;
    const seconds = 60;
    const data = rate * seconds;
    const wav = Buffer.alloc(44 + data);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(36 + data, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20); // PCM
    wav.writeUInt16LE(1, 22); // mono
    wav.writeUInt32LE(rate, 24);
    wav.writeUInt32LE(rate, 28);
    wav.writeUInt16LE(1, 32);
    wav.writeUInt16LE(8, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(data, 40);
    wav.fill(128, 44); // 8-bit silence
    await page.route("**/e2e-test-audio.wav", (route) =>
      route.fulfill({ status: 200, contentType: "audio/wav", body: wav }),
    );
    const track = {
      id: "e2e-test-track",
      title: "Test track",
      src: "/e2e-test-audio.wav",
      kindLabel: "Podcast",
      durationSec: seconds,
    };
    await page.addInitScript((t) => {
      if (!localStorage.getItem("ai-perception"))
        localStorage.setItem("ai-perception", JSON.stringify({ state: { track: t, currentTime: 0 }, version: 1 }));
    }, track);

    await open3d(page, "/explore?era=era-1");
    const dock = page.getByRole("region", { name: "Audio player" });
    // Keyboard, not a click: in development the Next dev-tools badge sits over the dock's Play button.
    await dock.getByRole("button", { name: "Play", exact: true }).press("Enter");
    await expect(dock.getByRole("button", { name: "Pause" })).toBeVisible();
    const status = () =>
      page.evaluate(
        () => (window as unknown as { __store: { getState: () => { status: string } } }).__store.getState().status,
      );
    const audioTime = () =>
      page.evaluate(
        () =>
          (window as unknown as { __store: { getState: () => { currentTime: number } } }).__store.getState()
            .currentTime,
      );
    await expect.poll(status).toBe("playing");

    // Drive for a while: the audio keeps running.
    const t0 = await audioTime();
    const p0 = await playerPose(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(2000);
    await page.keyboard.up("KeyW");
    const p1 = await playerPose(page);
    expect(Math.hypot(p1.x - p0.x, p1.z - p0.z), "the car drove").toBeGreaterThan(3);
    await expect.poll(audioTime).toBeGreaterThan(t0 + 1);
    expect(await status()).toBe("playing");

    // Leave for /read with the HUD's Read pill: the world tears down, the audio does not stop.
    const t1 = await audioTime();
    await page.getByRole("group", { name: "World controls" }).getByRole("link", { name: "Read", exact: true }).click();
    await expect(page).toHaveURL(/\/read/, { timeout: 15_000 });
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect.poll(audioTime).toBeGreaterThan(t1 + 1);
    expect(await status()).toBe("playing");
    await expect(dock.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("screenshot at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open3d(page, "/explore?era=era-1");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/explore-375.png" });
  });
});

test.describe("explore load watchdog", () => {
  test.setTimeout(150_000);

  test("3D that has not drawn a frame after 20 s falls back to reading mode", async ({ page }) => {
    // Physics never arrives (its chunk hangs), so the first frame never comes. The limit is 20 s (LOAD_TIMEOUT_MS;
    // docs/VISION.md overrides PLAN 6.6's 10 s); the loading screen keeps "Read in 2D instead" visible.
    await page.route(/rapier3d-compat/, () => {});
    // Time the loading state in the page itself (test polling lags when several workers share the CPU).
    await page.addInitScript(() => {
      const times: { loading?: number; left?: number } = {};
      (window as unknown as { __loadTimes: typeof times }).__loadTimes = times;
      new MutationObserver(() => {
        const state = document.querySelector("[data-explore-state]")?.getAttribute("data-explore-state");
        if (state === "loading") times.loading ??= performance.now();
        else if (times.loading !== undefined) times.left ??= performance.now();
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-explore-state"],
      });
    });
    // The hung chunk can hold up the window "load" event: do not wait for it.
    await page.goto("/explore?era=era-2", { waitUntil: "domcontentloaded" });
    const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!webgl2, "this browser has no WebGL 2");
    // While it waits, the way out is always on screen.
    await expect(page.getByRole("link", { name: "Read in 2D instead" })).toHaveAttribute("href", "/read");
    await expect(page.getByText("3D stopped, switched to reading mode")).toBeVisible({ timeout: 45_000 });
    const t = await page.evaluate(
      () => (window as unknown as { __loadTimes: { loading?: number; left?: number } }).__loadTimes,
    );
    const waited = (t.left ?? 0) - (t.loading ?? 0);
    expect(waited, "fell back after about 20 s").toBeGreaterThan(19_500);
    expect(waited).toBeLessThan(26_000);
    // The island the URL asked for.
    await expect(page).toHaveURL(/\/read\/the-jobs-era/, { timeout: 15_000 });
  });
});

test.describe("explore on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  test.setTimeout(150_000);
  test.beforeEach(async ({ page }) => {
    await relaxLoadWatchdog(page);
  });

  test("phones get a choice, and 3D shows touch controls (never a Leva panel)", async ({ page }) => {
    await page.goto("/explore");
    const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!webgl2, "this browser has no WebGL 2");
    const state = page.locator("[data-explore-state]");
    await expect(state).toHaveAttribute("data-explore-state", "choose");
    await expect(page.getByRole("heading", { name: "How do you want to explore?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read in 2D" })).toHaveAttribute("href", "/read");
    await page.getByRole("button", { name: "Explore in 3D" }).click();
    // The button disappears with the choice screen: focus moves to the skip link, still first in Tab order.
    // After a tap it stays screen-reader-only (shown on keyboard focus only), so it never covers the HUD.
    const skip = page.getByRole("link", { name: "Go to reading mode" });
    await expect(skip).toBeFocused();
    await expectReady(page);
    await expect(skip).toBeFocused();
    await expect(skip).toHaveCSS("position", "absolute");
    await expect(page.getByRole("button", { name: "Boost", exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Drive" }).getByRole("button")).toHaveCount(4);
    // No separate round "Open" button: the prompt's own "Tap to open / Tap to talk" is the interact button.
    await expect(page.getByRole("button", { name: "Open", exact: true })).toHaveCount(0);
    await expect(page.locator("[class*='leva']")).toHaveCount(0);
    await page.screenshot({ path: "screenshots/explore-phone-375.png" });
  });

  test("the interact prompt sits clear of the touch controls, chat button and audio dock", async ({ page }) => {
    await page.goto("/explore");
    const webgl2 = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
    test.skip(!webgl2, "this browser has no WebGL 2");
    await page.getByRole("button", { name: "Explore in 3D" }).click();
    await expectReady(page);
    // Put the visitor "near" things through the dev-only store hook (driving there on a phone is slow and
    // the arrow pad is DOM): the prompt is the same either way.
    type Near = { getState: () => { setNearGuide: (n: boolean) => void; enterBuilding: (id: string) => void } };
    type Box = { x: number; y: number; width: number; height: number };

    const card = page.locator("[data-interact-prompt] > div");
    const tap = page.locator("#interact-prompt-button");
    const others = {
      "arrow pad": page.locator("[data-touch-pad]"),
      Boost: page.getByRole("button", { name: "Boost", exact: true }),
      "chat button": page.getByRole("button", { name: "Ask the guide" }),
      "audio dock": page.getByRole("region", { name: "Audio player" }),
    };
    const overlaps = (a: Box, b: Box) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const checkClear = async (label: string) => {
      await expect(card).toBeVisible();
      const c = await card.boundingBox();
      expect(c, `${label}: prompt box`).toBeTruthy();
      for (const [name, el] of Object.entries(others)) {
        await expect(el, `${label}: ${name} is shown`).toBeVisible();
        const o = await el.boundingBox();
        expect(o, `${label}: ${name} box`).toBeTruthy();
        expect(overlaps(c!, o!), `${label}: prompt vs ${name}`).toBe(false);
      }
      // The whole card is on screen (nothing cut off at the edges).
      expect(c!.x).toBeGreaterThanOrEqual(0);
      expect(c!.x + c!.width).toBeLessThanOrEqual(375);
      // The tap target meets the 44 px touch-target size.
      const t = await tap.boundingBox();
      expect(t!.height, `${label}: tap target height`).toBeGreaterThanOrEqual(44);
    };

    // Near the guide (the longest prompt), then near a building.
    await page.evaluate(() => (window as unknown as { __store: Near }).__store.getState().setNearGuide(true));
    await checkClear("guide");
    await expect(page.getByRole("button", { name: /Tap to talk/ })).toBeVisible();
    await page.evaluate(() => (window as unknown as { __store: Near }).__store.getState().setNearGuide(false));
    const target = buildings[0];
    if (target) {
      await page.evaluate(
        (id) => (window as unknown as { __store: Near }).__store.getState().enterBuilding(id),
        target.id,
      );
      await checkClear("building");
      await expect(page.getByRole("button", { name: /Tap to open/ })).toBeVisible();
      await page.screenshot({ path: "screenshots/explore-phone-375-prompt.png" });
    }
  });
});

/** Features added 22 Nov 2026 (docs/VISION.md): References building, NPC figures, free-look camera. */
test.describe("world features", () => {
  test.describe.configure({ mode: "default" });
  test.setTimeout(150_000);
  test.beforeEach(async ({ page }) => {
    await relaxLoadWatchdog(page);
  });

  test("every island has a generated References building that lists its sources", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?b=era-1-references");
    const drawer = visibleDialogs(page);
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    await expect(drawer.getByRole("heading", { name: /^References/ })).toBeVisible();
    const links = drawer.locator("li a[href^='http']");
    expect(await links.count()).toBeGreaterThan(0);
    await expect(drawer.getByRole("link", { name: "Read more" })).toHaveAttribute(
      "href",
      /\/read\/[a-z0-9-]+#era-1-references$/,
    );
    // The other two islands have one as well.
    for (const id of ["era-2-references", "era-3-references"]) {
      await page.evaluate(
        (b) =>
          (window as unknown as { __store: { getState: () => { openBuilding: (id: string) => void } } }).__store
            .getState()
            .openBuilding(b),
        id,
      );
      await expect(visibleDialogs(page).locator("li a[href^='http']").first()).toBeVisible();
    }
  });

  test("first person: a full turn all the way round, kept until C, and the car body is out of the way", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?era=era-1");
    await page.locator("body").press("v");
    const yaw = () =>
      page.evaluate(
        () => (window as unknown as { __explore: { look: { yawTarget: number } } }).__explore.look.yawTarget,
      );
    // Drag right well past half a turn: no stop.
    await page.mouse.move(200, 450);
    await page.mouse.down();
    await page.mouse.move(1300, 450, { steps: 10 });
    await page.mouse.up();
    expect(Math.abs(await yaw())).toBeGreaterThan(Math.PI * 1.5);
    // Parked: the view stays where it was left.
    const left = await yaw();
    await page.waitForTimeout(3200);
    expect(await yaw()).toBeCloseTo(left, 5);
    await page.locator("body").press("c");
    expect(await yaw()).toBe(0);
  });

  test("CPU-drawn 3D starts on Low with fewer pixels and shows the graphics acceleration tip", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __exploreAssumeHardware: boolean }).__exploreAssumeHardware = false;
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?era=era-1");
    expect(
      await page
        .locator("canvas")
        .first()
        .evaluate((c: HTMLCanvasElement) => c.width),
    ).toBeLessThan(1200);
    const tip = page.locator("[data-software-notice]");
    await expect(tip).toContainText("graphics acceleration");
    await tip.getByRole("button", { name: "Close this tip" }).click();
    await expect(tip).toBeHidden();
  });

  test("the team island: the Team button goes there, and each statue names its member", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open3d(page, "/explore?era=era-2");
    // Four island pills still fit a phone.
    const team = page.getByRole("button", { name: "Team", exact: true }).filter({ visible: true });
    const box = await team.boundingBox();
    expect(box && box.x + box.width).toBeLessThanOrEqual(375);
    await team.click();
    await expect.poll(async () => (await playerPose(page)).z, { timeout: 15_000 }).toBeLessThan(-80);
    // The middle statue stands straight ahead of the arrival point.
    await page.evaluate(() =>
      (window as unknown as { __explore: { requestTeleport: (p: object) => void } }).__explore.requestTeleport({
        x: 0,
        y: 1.2,
        z: -101,
        heading: Math.PI,
      }),
    );
    await expect(page.locator("[data-interact-prompt]")).toContainText(site.team[1]!.name, { timeout: 15_000 });
  });

  test("faceless NPCs stand around every island", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore");
    const counts = () =>
      page.evaluate(() => (window as unknown as { __npcCounts?: Record<string, number> }).__npcCounts ?? {});
    await expect.poll(async () => Object.keys(await counts()).sort()).toEqual(["era-1", "era-2", "era-3"]);
    for (const n of Object.values(await counts())) expect(n).toBeGreaterThan(0);
  });

  test("free look: drag turns and tilts, the wheel zooms, Recenter and C bring the view back", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore");
    type FreeLook = { __store: { getState: () => { freeLook: boolean } } };
    const freeLook = () => page.evaluate(() => (window as unknown as FreeLook).__store.getState().freeLook);
    const recenter = page.getByRole("button", { name: /^Recenter/ });
    await expect(recenter).toHaveCount(0);

    // Right-drag on the world turns and tilts the view.
    const box = (await page.locator("canvas").first().boundingBox())!;
    const cx = box.x + box.width * 0.6;
    const cy = box.y + box.height * 0.6;
    await page.mouse.move(cx, cy);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(cx + 160, cy + 60, { steps: 8 });
    await page.mouse.up({ button: "right" });
    await expect.poll(freeLook).toBe(true);
    await expect(recenter).toBeVisible();
    await page.keyboard.press("c");
    await expect.poll(freeLook).toBe(false);
    await expect(recenter).toHaveCount(0);

    // The wheel zooms out; the Recenter button brings it back.
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, 600);
    await expect.poll(freeLook).toBe(true);
    await recenter.click();
    await expect.poll(freeLook).toBe(false);
  });

  test("round 5: building charts, the long References list scrolls, and podcast hosts follow the speakers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open3d(page, "/explore?b=experts-vs-public");
    const drawer = visibleDialogs(page);
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    // Grouped bars: both series in the legend, the paraphrased wording as a note, population in the source line.
    const chart = drawer.locator("[data-embedded-chart='experts-vs-public']");
    await expect(chart.getByRole("list", { name: "Legend" })).toContainText("AI experts");
    await expect(chart.getByRole("list", { name: "Legend" })).toContainText("U.S. adults");
    await expect(chart.getByText("Note:", { exact: true })).toBeVisible();
    await expect(chart).toContainText("1,013 AI experts");
    await page.screenshot({ path: "screenshots/drawer-experts-vs-public-375.png" });

    const open = (id: string) =>
      page.evaluate(
        (b) =>
          (window as unknown as { __store: { getState: () => { openBuilding: (id: string) => void } } }).__store
            .getState()
            .openBuilding(b),
        id,
      );
    await open("training-lab");
    await expect(visibleDialogs(page).locator("[data-embedded-chart='shutdown-resistance']")).toContainText("97%");

    // The Future's References list is long: its last entry scrolls into view inside the drawer.
    await open("era-3-references");
    const last = visibleDialogs(page).locator("li").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    await page.screenshot({ path: "screenshots/drawer-era-3-references-375.png" });

    // One faceless figure per episode speaker: 3 for episode 1 (with the fictional guest), 2 for episode 2,
    // 3 for episode 3 (three hosts).
    const want = Object.fromEntries(
      buildings.filter((b) => b.kind === "podcast").map((b) => [b.id, b.media?.episodeId ?? ""]),
    );
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __hostCounts?: Record<string, number> }).__hostCounts ?? {}),
      )
      .toEqual(Object.fromEntries(Object.keys(want).map((id) => [id, id === "era-2-podcast" ? 2 : 3])));
  });

  test("screenshot: the podcast studio on The Future with its three hosts (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open3d(page, "/explore?b=era-3-podcast");
    await expect(visibleDialogs(page)).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: "screenshots/explore-era-3-podcast-drawer-1440.png" });
    await visibleDialogs(page).getByRole("button", { name: "Close" }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/explore-era-3-podcast-1440.png" });
    // Free look round to the road side, where the hosts stand by the door, and zoom in.
    await page.mouse.move(720, 450);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(1320, 450, { steps: 20 });
    await page.mouse.up({ button: "right" });
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/explore-era-3-podcast-hosts-1440.png" });
  });

  test("round 7/8: the video loads only near its building, plays in the drawer, and ducks the music", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const asked: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes(".mp4")) asked.push(new URL(r.url()).pathname);
    });
    await open3d(page, "/explore?era=era-2");
    expect(asked).toEqual([]);
    const open = (id: string) =>
      page.evaluate(
        (b) =>
          (window as unknown as { __store: { getState: () => { openBuilding: (id: string) => void } } }).__store
            .getState()
            .openBuilding(b),
        id,
      );
    await open("interface-gallery");
    const video = visibleDialogs(page).locator("video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(visibleDialogs(page)).toContainText("made with Claude (Anthropic)");
    await expect.poll(() => [...new Set(asked)]).toEqual(["/videos/interface-gallery.mp4"]);
    await page.screenshot({ path: "screenshots/drawer-video-1440.png" });

    // Audible video -> videoSound (Chromium here has no H.264, so the media events are simulated).
    const videoSound = () =>
      page.evaluate(
        () =>
          (window as unknown as { __store: { getState: () => { videoSound: boolean } } }).__store.getState().videoSound,
      );
    await video.evaluate((v: HTMLVideoElement) => {
      Object.defineProperty(v, "paused", { value: false, configurable: true });
      v.muted = false;
      v.dispatchEvent(new Event("playing"));
    });
    await expect.poll(videoSound).toBe(true);
    await visibleDialogs(page).getByRole("button", { name: "Close" }).click();
    await expect.poll(videoSound).toBe(false);
  });

  test("screenshots: drawers with a video and a photo at 375px, and a chart and a photo at 1440px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open3d(page, "/explore?b=perceptron-cinema");
    const open = (id: string) =>
      page.evaluate(
        (b) =>
          (window as unknown as { __store: { getState: () => { openBuilding: (id: string) => void } } }).__store
            .getState()
            .openBuilding(b),
        id,
      );
    await expect(visibleDialogs(page)).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: "screenshots/drawer-video-375.png" });
    await open("mainframe-archive");
    await expect(visibleDialogs(page).getByRole("heading", { level: 2 })).toContainText("Room-sized");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "screenshots/drawer-photo-375.png" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: "screenshots/drawer-photo-1440.png" });
    await open("experts-vs-public");
    await expect(visibleDialogs(page).locator("[data-embedded-chart]")).toBeVisible();
    await page.screenshot({ path: "screenshots/drawer-chart-1440.png" });
    const wide = await visibleDialogs(page).evaluate((d) => {
      const body = d.querySelector(".overflow-y-auto")!;
      return body.scrollWidth - body.clientWidth;
    });
    expect(wide, "sideways overflow in the drawer").toBeLessThanOrEqual(0);
  });
});
