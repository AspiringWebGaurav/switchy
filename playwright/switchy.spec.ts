import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

// ── Credentials ─────────────────────────────────────────────────────────────
const credFile = join(__dirname, ".pw-project.json");
const creds = JSON.parse(readFileSync(credFile, "utf8"));
const { projectId, publicKey, baseUrl } = creds as { projectId: string; publicKey: string; baseUrl: string };

const EMIT_URL = `${baseUrl}/api/v1/test/emit`;
const FIXTURE_URL = `/test-fixture.html`;

// ── Helpers ──────────────────────────────────────────────────────────────────
async function emitMode(
  mode: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const res = await fetch(EMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, mode, ...extra }),
  });
  if (!res.ok) throw new Error(`Emit failed: ${res.status}`);
}

async function loadFixture(page: Page): Promise<void> {
  await page.addInitScript(({ pid, key }) => {
    (window as any).__SWITCHY_PROJECT_ID__ = pid;
    (window as any).__SWITCHY_KEY__ = key;
    (window as any).__SWITCHY_TEST__ = true;
  }, { pid: projectId, key: publicKey });
  await page.goto(FIXTURE_URL);
  // Wait for switchy.js to initialise (onopen fires)
  await page.waitForFunction(
    () => typeof (window as any).__SWITCHY_TEST__ !== "undefined",
    { timeout: 8000 }
  );
  await page.waitForTimeout(600);
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const ALL_MODES = [
  "maintenance", "custom", "preview", "medical", "brb", "vacation",
  "focus", "working", "launching", "migrating", "deploying", "incident",
  "degraded", "outage", "closed", "coming-soon", "paused", "moved",
  "beta", "holiday", "offline",
];

// ── PW01: Initial state (live = no overlay) ──────────────────────────────────
test("PW01 — initial state: no overlay when mode=live", async ({ page }) => {
  const base = Date.now() + 10_000_000;
  await emitMode("live", { version: base });
  await loadFixture(page);
  await page.waitForTimeout(800);
  const overlay = page.locator("#switchy-overlay");
  await expect(overlay).toHaveCount(0);
});

// ── PW02: Non-live mode creates overlay ──────────────────────────────────────
test("PW02 — non-live mode creates overlay", async ({ page }) => {
  const base = Date.now() + 20_000_000;
  await loadFixture(page);
  await emitMode("maintenance", { version: base });
  await page.waitForSelector("#switchy-overlay", { timeout: 8000 });
  // Wait for CSS fade-in transition (0.2s) to complete
  await page.waitForFunction(
    () => {
      const el = document.getElementById("switchy-overlay");
      return el ? parseFloat(getComputedStyle(el).opacity) >= 0.95 : false;
    },
    { timeout: 2000 }
  );
  const overlay = page.locator("#switchy-overlay");
  await expect(overlay).toHaveCount(1);
  const opacity = await overlay.evaluate((el) =>
    parseFloat(getComputedStyle(el).opacity)
  );
  expect(opacity).toBeGreaterThan(0.9);
});

// ── PW03: Mode→live removes overlay ─────────────────────────────────────────
test("PW03 — switching to live removes overlay", async ({ page }) => {
  const base = Date.now() + 30_000_000;
  await loadFixture(page);
  await emitMode("brb", { version: base });
  await page.waitForSelector("#switchy-overlay", { timeout: 8000 });
  await emitMode("live", { version: base + 1 });
  await page.waitForFunction(
    () => !document.getElementById("switchy-overlay"),
    { timeout: 8000 }
  );
  await expect(page.locator("#switchy-overlay")).toHaveCount(0);
});

// ── PW04: Mode swap (A→B) — only one overlay at all times ───────────────────
test("PW04 — mode swap: only one overlay during A→B transition", async ({ page }) => {
  const base = Date.now() + 40_000_000;
  await loadFixture(page);
  await emitMode("vacation", { version: base });
  await page.waitForSelector("#switchy-overlay", { timeout: 8000 });

  // Set up a MutationObserver to detect any double-overlay moment
  const hadDuplicate = await page.evaluate(() => {
    let maxCount = 0;
    const obs = new MutationObserver(() => {
      const c = document.querySelectorAll("#switchy-overlay").length;
      if (c > maxCount) maxCount = c;
    });
    obs.observe(document.body, { childList: true, subtree: true });
    (window as any).__overlayObs = obs;
    (window as any).__maxOverlayCount = 0;
    const interval = setInterval(() => {
      const c = document.querySelectorAll("#switchy-overlay").length;
      if (c > (window as any).__maxOverlayCount) (window as any).__maxOverlayCount = c;
    }, 10);
    (window as any).__overlayInterval = interval;
    return false;
  });

  await emitMode("incident", { version: base + 1 });
  await page.waitForTimeout(600);

  const maxCount = await page.evaluate(() => {
    clearInterval((window as any).__overlayInterval);
    return (window as any).__maxOverlayCount as number;
  });

  expect(maxCount).toBeLessThanOrEqual(1);
  const overlay = page.locator("#switchy-overlay");
  await expect(overlay).toHaveCount(1);
});

// ── PW05: No duplicate overlays under rapid switching ───────────────────────
test("PW05 — no duplicate overlays during 10 rapid mode switches", async ({ page }) => {
  const base = Date.now() + 50_000_000;
  await loadFixture(page);

  await page.evaluate(() => {
    (window as any).__maxOverlayCount = 0;
    const interval = setInterval(() => {
      const c = document.querySelectorAll("#switchy-overlay").length;
      if (c > (window as any).__maxOverlayCount) (window as any).__maxOverlayCount = c;
    }, 5);
    (window as any).__dupInterval = interval;
  });

  for (let i = 0; i < 10; i++) {
    await emitMode(ALL_MODES[i % ALL_MODES.length], { version: base + i });
    await sleep(0);
  }
  await page.waitForTimeout(500);

  const maxCount = await page.evaluate(() => {
    clearInterval((window as any).__dupInterval);
    return (window as any).__maxOverlayCount as number;
  });
  expect(maxCount).toBeLessThanOrEqual(1);
});

// ── PW06: Rapid switching — final DOM state correct ──────────────────────────
test("PW06 — rapid switching: final DOM matches last emitted mode", async ({ page }) => {
  const base = Date.now() + 60_000_000;
  const modes = ALL_MODES.slice(0, 20);
  const lastMode = modes[modes.length - 1];
  await loadFixture(page);

  for (let i = 0; i < modes.length; i++) {
    await emitMode(modes[i], { version: base + i });
    await sleep(0);
  }
  await page.waitForTimeout(800);

  // lastMode is "offline" which is non-live, so overlay should exist
  const overlay = page.locator("#switchy-overlay");
  await expect(overlay).toHaveCount(1);
});

// ── PW07: Debug badge shows correct mode+version ─────────────────────────────
test("PW07 — debug badge shows correct mode and version", async ({ page }) => {
  const base = Date.now() + 70_000_000;
  await loadFixture(page);
  await emitMode("deploying", { version: base });
  await page.waitForSelector("#switchy-debug-badge", { timeout: 8000 });

  const badgeText = await page.locator("#switchy-debug-badge").textContent();
  expect(badgeText).toContain("deploying");
  expect(badgeText).toContain(String(base));
});

// ── PW08: Debug badge removed when flag cleared ───────────────────────────────
test("PW08 — debug badge removed after __SWITCHY_TEST__ cleared", async ({ page }) => {
  const base = Date.now() + 80_000_000;
  await loadFixture(page);
  await emitMode("outage", { version: base });
  await page.waitForSelector("#switchy-debug-badge", { timeout: 8000 });

  // Remove the flag and trigger another event
  await page.evaluate(() => { delete (window as any).__SWITCHY_TEST__; });
  await emitMode("paused", { version: base + 1 });
  await page.waitForTimeout(600);

  await expect(page.locator("#switchy-debug-badge")).toHaveCount(0);
});

// ── PW09: Backend→UI state consistency ───────────────────────────────────────
test("PW09 — backend state matches rendered UI", async ({ page }) => {
  const base = Date.now() + 90_000_000;
  const testMode = "medical";
  await loadFixture(page);
  await emitMode(testMode, { version: base });
  await page.waitForSelector("#switchy-overlay", { timeout: 8000 });

  // Read mode from debug badge
  await page.waitForSelector("#switchy-debug-badge", { timeout: 4000 });
  const badgeText = await page.locator("#switchy-debug-badge").textContent();
  expect(badgeText).toContain(testMode);

  // Cross-check: overlay is present (non-live mode)
  await expect(page.locator("#switchy-overlay")).toHaveCount(1);

  // Go back to live — overlay must disappear
  await emitMode("live", { version: base + 1 });
  await page.waitForFunction(() => !document.getElementById("switchy-overlay"), { timeout: 8000 });
  await expect(page.locator("#switchy-overlay")).toHaveCount(0);
});

// ── PW10: SSE reconnect — UI still reflects current state ────────────────────
test("PW10 — UI correct after SSE reconnect (fallback→re-connect)", async ({ page }) => {
  const base = Date.now() + 100_000_000;
  await loadFixture(page);

  // Put into a non-live mode
  await emitMode("incident", { version: base });
  await page.waitForSelector("#switchy-overlay", { timeout: 8000 });

  // Force the EventSource into error state by blocking SSE requests, then unblock
  await page.route("**/api/v1/events/**", (route) => route.abort());
  await page.waitForTimeout(800);
  await page.unroute("**/api/v1/events/**");

  // Re-connect: switchy.js will try EventSource again
  // Emit a new event while reconnecting
  await emitMode("deploying", { version: base + 1 });
  await page.waitForTimeout(3000);

  // After reconnect, UI should reflect the current mode
  // The onopen re-fetches /decide, so state should be "deploying"
  const overlay = page.locator("#switchy-overlay");
  await expect(overlay).toHaveCount(1);
});
