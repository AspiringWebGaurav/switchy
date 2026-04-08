#!/usr/bin/env node
/**
 * Visibility E2E Test Suite
 * Tests: switchy.js overlay blocking/allowing based on visibility settings
 * Uses Playwright to verify actual browser behavior
 */

import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, writeFileSync, unlinkSync } from "fs";

// Load environment variables
config({ path: ".env.local" });

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const API_BASE = "http://localhost:3000";
const TEST_SERVER_PORT = 9999;

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

// Test state
let testUserId = null;
let testProjectId = null;
let testPublicKey = null;
let testServer = null;
let browser = null;
let passed = 0;
let failed = 0;

// Colors
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function log(msg) {
  console.log(`${CYAN}[TEST]${RESET} ${msg}`);
}

function pass(name) {
  passed++;
  console.log(`  ${GREEN}✓${RESET} ${name}`);
}

function fail(name, error) {
  failed++;
  console.log(`  ${RED}✗${RESET} ${name}`);
  console.log(`    ${RED}Error: ${error}${RESET}`);
}

// Redis helpers
async function redisDel(key) {
  await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["DEL", key]),
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

// Generate test HTML that embeds switchy.js
function generateTestHtml(projectId, publicKey) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Switchy Visibility Test</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    #status { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .checking { background: #fef3c7; color: #92400e; }
    .blocked { background: #fee2e2; color: #991b1b; }
    .allowed { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <h1>Switchy Visibility Test Page</h1>
  <div id="status" class="checking">Checking overlay status...</div>
  <p>Project ID: ${projectId}</p>
  <p>Hostname: <span id="hostname"></span></p>
  
  <script>
    document.getElementById('hostname').textContent = window.location.hostname;
    
    // Track if overlay appears
    window.__switchyOverlayShown = false;
    window.__switchyOverlayBlocked = false;
    window.__switchyDecisionData = null;
    
    // Override to track overlay creation
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tag) {
      const el = originalCreateElement(tag);
      if (tag === 'div') {
        const origSetAttribute = el.setAttribute.bind(el);
        el.setAttribute = function(name, value) {
          if (name === 'id' && value === 'switchy-overlay') {
            window.__switchyOverlayShown = true;
            updateStatus();
          }
          return origSetAttribute(name, value);
        };
      }
      return el;
    };
    
    function updateStatus() {
      const status = document.getElementById('status');
      if (window.__switchyOverlayBlocked) {
        status.className = 'blocked';
        status.textContent = 'Overlay BLOCKED by visibility settings';
      } else if (window.__switchyOverlayShown) {
        status.className = 'allowed';
        status.textContent = 'Overlay SHOWN (allowed)';
      }
    }
    
    // Check after a delay
    setTimeout(() => {
      if (!window.__switchyOverlayShown && !window.__switchyOverlayBlocked) {
        const status = document.getElementById('status');
        status.className = 'blocked';
        status.textContent = 'Overlay NOT shown (blocked or mode=live)';
      }
    }, 3000);
  </script>
  
  <script src="${API_BASE}/switchy.js?project=${projectId}&key=${publicKey}"></script>
</body>
</html>`;
}

// Start test HTTP server
function startTestServer(projectId, publicKey) {
  return new Promise((resolve) => {
    const html = generateTestHtml(projectId, publicKey);
    
    testServer = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
    
    testServer.listen(TEST_SERVER_PORT, () => {
      log(`Test server running at http://localhost:${TEST_SERVER_PORT}`);
      resolve();
    });
  });
}

function stopTestServer() {
  return new Promise((resolve) => {
    if (testServer) {
      testServer.close(resolve);
    } else {
      resolve();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

async function setup() {
  log("Setting up test environment...");

  // Create test user
  testUserId = `test_vis_user_${generateId()}`;
  await db.collection("users").doc(testUserId).set({
    uid: testUserId,
    name: "Visibility Test User",
    email: `vis_test_${generateId()}@example.com`,
    preferences: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  log(`Created test user: ${testUserId}`);

  // Create test project
  testProjectId = `test_vis_proj_${generateId()}`;
  testPublicKey = `pk_test_${generateId()}${generateId()}`;
  await db.collection("projects").doc(testProjectId).set({
    id: testProjectId,
    ownerId: testUserId,
    name: "Visibility Test Project",
    publicKey: testPublicKey,
    enabled: true,
    detected: true,
    settings: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  log(`Created test project: ${testProjectId}`);

  // Create mode policy - set to "maintenance" so overlay shows
  await db
    .collection("projects")
    .doc(testProjectId)
    .collection("policies")
    .doc("mode")
    .set({
      value: "maintenance",
      config: {
        message: "Test maintenance message",
        buttonText: "OK",
        redirectUrl: null,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  log("Created mode policy (maintenance mode)");

  // Wait for Firestore sync
  await new Promise((r) => setTimeout(r, 1000));

  // Start test server
  await startTestServer(testProjectId, testPublicKey);

  // Launch browser
  browser = await chromium.launch({ headless: true });
  log("Browser launched");
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function updateUserPrefs(prefs) {
  await db.collection("users").doc(testUserId).update({
    preferences: prefs,
    updatedAt: Date.now(),
  });
  await redisDel(`decide:${testProjectId}`);
  await new Promise((r) => setTimeout(r, 300));
}

async function updateProjectSettings(settings) {
  await db.collection("projects").doc(testProjectId).update({
    settings,
    updatedAt: Date.now(),
  });
  await redisDel(`decide:${testProjectId}`);
  await new Promise((r) => setTimeout(r, 300));
}

async function checkOverlayVisible(testName, expectVisible) {
  const page = await browser.newPage();
  
  // Enable debug mode
  await page.addInitScript(() => {
    localStorage.setItem('switchy_debug', 'true');
  });

  const logs = [];
  page.on('console', (msg) => logs.push(msg.text()));
  page.on('pageerror', (err) => logs.push(`ERROR: ${err.message}`));

  try {
    // Navigate to test page (use domcontentloaded since SSE keeps connection open)
    await page.goto(`http://localhost:${TEST_SERVER_PORT}`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    // Wait for overlay to potentially appear
    await page.waitForTimeout(2500);

    // Check if overlay exists
    const overlay = await page.$('#switchy-overlay');
    const isVisible = overlay !== null;

    if (isVisible === expectVisible) {
      pass(testName);
    } else {
      const switchyLogs = logs.filter(l => l.includes('Switchy'));
      fail(testName, `Expected ${expectVisible ? "visible" : "hidden"}, got ${isVisible ? "visible" : "hidden"}. Logs: ${switchyLogs.slice(0,3).join(' | ')}`);
    }
  } catch (e) {
    fail(testName, e.message);
  } finally {
    await page.close();
  }
}

async function checkOverlayWithDebug(testName, expectVisible, debugCheck) {
  const page = await browser.newPage();
  
  // Enable debug mode
  await page.addInitScript(() => {
    localStorage.setItem('switchy_debug', 'true');
  });

  const logs = [];
  page.on('console', (msg) => {
    if (msg.text().includes('Switchy')) {
      logs.push(msg.text());
    }
  });

  try {
    await page.goto(`http://localhost:${TEST_SERVER_PORT}`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    await page.waitForTimeout(2500);

    const overlay = await page.$('#switchy-overlay');
    const isVisible = overlay !== null;

    // Check debug logs if needed
    let debugPassed = true;
    if (debugCheck) {
      debugPassed = logs.some(log => log.includes(debugCheck));
    }

    if (isVisible === expectVisible && debugPassed) {
      pass(testName);
    } else {
      const details = [];
      if (isVisible !== expectVisible) {
        details.push(`overlay ${isVisible ? "visible" : "hidden"}`);
      }
      if (!debugPassed) {
        details.push(`missing debug log: "${debugCheck}"`);
      }
      fail(testName, details.join(", "));
    }
  } catch (e) {
    fail(testName, e.message);
  } finally {
    await page.close();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════

async function testDevEnvironmentBlocking() {
  console.log(`\n${BOLD}${YELLOW}═══ DEV ENVIRONMENT BLOCKING TESTS ═══${RESET}\n`);

  // V1: Default - devOverlayEnabled=false, localhost should be blocked
  await updateUserPrefs({ devOverlayEnabled: false });
  await checkOverlayWithDebug(
    "V1: Overlay blocked on localhost when devOverlayEnabled=false",
    false,
    "BLOCKED"
  );

  // V2: devOverlayEnabled=true, localhost should show overlay
  await updateUserPrefs({ devOverlayEnabled: true });
  await checkOverlayVisible(
    "V2: Overlay shown on localhost when devOverlayEnabled=true",
    true
  );

  // V3: Project override - devOverlayEnabled=false overrides user's true
  await updateProjectSettings({ devOverlayEnabled: false });
  await checkOverlayVisible(
    "V3: Project setting overrides user - overlay blocked",
    false
  );

  // V4: Project override - devOverlayEnabled=true
  await updateProjectSettings({ devOverlayEnabled: true });
  await checkOverlayVisible(
    "V4: Project devOverlayEnabled=true shows overlay",
    true
  );

  // Reset
  await updateUserPrefs({ devOverlayEnabled: true });
  await updateProjectSettings({});
}

async function testDomainBlocklist() {
  console.log(`\n${BOLD}${YELLOW}═══ DOMAIN BLOCKLIST TESTS ═══${RESET}\n`);

  // Ensure dev overlay is enabled so we can test domain rules
  await updateUserPrefs({ devOverlayEnabled: true, domainBlocklist: [] });
  await updateProjectSettings({});

  // V5: No blocklist - overlay should show
  await checkOverlayVisible(
    "V5: No blocklist - overlay shows on localhost",
    true
  );

  // V6: localhost in blocklist - overlay should be blocked
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainBlocklist: ["localhost"],
  });
  await checkOverlayWithDebug(
    "V6: localhost in blocklist - overlay blocked",
    false,
    "BLOCKED"
  );

  // V7: 127.0.0.1 in blocklist (test with localhost)
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainBlocklist: ["127.0.0.1"],
  });
  // localhost !== 127.0.0.1, so should show
  await checkOverlayVisible(
    "V7: 127.0.0.1 in blocklist, accessing via localhost - overlay shows",
    true
  );

  // V8: Project blocklist overrides user
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainBlocklist: [],
  });
  await updateProjectSettings({
    domainBlocklist: ["localhost"],
  });
  await checkOverlayVisible(
    "V8: Project blocklist blocks localhost",
    false
  );

  // Reset
  await updateUserPrefs({ devOverlayEnabled: true, domainBlocklist: [] });
  await updateProjectSettings({});
}

async function testDomainAllowlist() {
  console.log(`\n${BOLD}${YELLOW}═══ DOMAIN ALLOWLIST TESTS ═══${RESET}\n`);

  // V9: Empty allowlist - show everywhere (that passes other checks)
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: [],
  });
  await checkOverlayVisible(
    "V9: Empty allowlist - overlay shows on localhost",
    true
  );

  // V10: localhost in allowlist - should show
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: ["localhost"],
  });
  await checkOverlayVisible(
    "V10: localhost in allowlist - overlay shows",
    true
  );

  // V11: Only example.com in allowlist - localhost blocked
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: ["example.com"],
  });
  await checkOverlayWithDebug(
    "V11: example.com in allowlist (not localhost) - overlay blocked",
    false,
    "not in allowlist"
  );

  // V12: Wildcard allowlist *.localhost (also matches bare localhost)
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: ["*.localhost"],
  });
  // *.example.com matches both sub.example.com AND example.com
  await checkOverlayVisible(
    "V12: *.localhost in allowlist - matches localhost too",
    true
  );

  // Reset
  await updateUserPrefs({ devOverlayEnabled: true, domainAllowlist: [] });
  await updateProjectSettings({});
}

async function testBlocklistPrecedence() {
  console.log(`\n${BOLD}${YELLOW}═══ BLOCKLIST PRECEDENCE TESTS ═══${RESET}\n`);

  // V13: Blocklist takes precedence over allowlist
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: ["localhost"],
    domainBlocklist: ["localhost"],
  });
  await checkOverlayWithDebug(
    "V13: localhost in both lists - blocklist wins, overlay blocked",
    false,
    "BLOCKED"
  );

  // V14: Different domains in each list
  await updateUserPrefs({
    devOverlayEnabled: true,
    domainAllowlist: ["localhost"],
    domainBlocklist: ["example.com"],
  });
  await checkOverlayVisible(
    "V14: localhost in allowlist, example.com in blocklist - overlay shows",
    true
  );

  // Reset
  await updateUserPrefs({ devOverlayEnabled: true, domainAllowlist: [], domainBlocklist: [] });
}

async function testModeInteraction() {
  console.log(`\n${BOLD}${YELLOW}═══ MODE INTERACTION TESTS ═══${RESET}\n`);

  // V15: Live mode never shows overlay regardless of settings
  await db
    .collection("projects")
    .doc(testProjectId)
    .collection("policies")
    .doc("mode")
    .update({ value: "live" });
  await redisDel(`decide:${testProjectId}`);
  await new Promise((r) => setTimeout(r, 300));

  await updateUserPrefs({ devOverlayEnabled: true });
  await checkOverlayVisible(
    "V15: Live mode - overlay never shows even with devOverlayEnabled=true",
    false
  );

  // V16: Back to maintenance mode - should show
  await db
    .collection("projects")
    .doc(testProjectId)
    .collection("policies")
    .doc("mode")
    .update({ value: "maintenance" });
  await redisDel(`decide:${testProjectId}`);
  await new Promise((r) => setTimeout(r, 300));

  await checkOverlayVisible(
    "V16: Maintenance mode with devOverlayEnabled=true - overlay shows",
    true
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

async function cleanup() {
  console.log(`\n${BOLD}${YELLOW}═══ CLEANUP ═══${RESET}\n`);

  try {
    // Close browser
    if (browser) {
      await browser.close();
      log("Browser closed");
    }

    // Stop test server
    await stopTestServer();
    log("Test server stopped");

    // Delete project policies
    const policiesSnap = await db
      .collection("projects")
      .doc(testProjectId)
      .collection("policies")
      .get();
    for (const doc of policiesSnap.docs) {
      await doc.ref.delete();
    }

    // Delete project
    await db.collection("projects").doc(testProjectId).delete();
    log(`Deleted project: ${testProjectId}`);

    // Delete user
    await db.collection("users").doc(testUserId).delete();
    log(`Deleted user: ${testUserId}`);

    // Clean Redis
    await redisDel(`decide:${testProjectId}`);
    log("Cleaned Redis cache");

    log(`${GREEN}✓ Cleanup complete${RESET}`);
  } catch (e) {
    console.error(`${RED}Cleanup error: ${e.message}${RESET}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║       VISIBILITY E2E TEST SUITE (Browser)                  ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  try {
    await setup();

    await testDevEnvironmentBlocking();
    await testDomainBlocklist();
    await testDomainAllowlist();
    await testBlocklistPrecedence();
    await testModeInteraction();

    // Summary
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}RESULTS: ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}\n`);

    await cleanup();
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error(`${RED}Fatal error: ${e.message}${RESET}`);
    console.error(e.stack);
    await cleanup();
    process.exit(1);
  }
}

main();
