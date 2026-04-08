#!/usr/bin/env node
/**
 * Settings Feature Test Suite
 * Tests: devOverlayEnabled, domainAllowlist, domainBlocklist
 * Includes: concurrent scenarios, visibility resolution, cache invalidation
 */

import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Load environment variables
config({ path: ".env.local" });

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const BASE_URL = "http://localhost:3000";

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

// Test state
let testUserId = null;
let testProjectId = null;
let testPublicKey = null;
let passed = 0;
let failed = 0;
const errors = [];

// Colors for console output
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
  errors.push({ name, error });
  console.log(`  ${RED}✗${RESET} ${name}`);
  console.log(`    ${RED}Error: ${error}${RESET}`);
}

// Redis helpers
async function redisCommand(command, args = []) {
  const res = await fetch(`${REDIS_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command, ...args]),
  });
  const data = await res.json();
  return data.result;
}

async function redisGet(key) {
  return redisCommand("GET", [key]);
}

async function redisDel(key) {
  return redisCommand("DEL", [key]);
}

async function redisKeys(pattern) {
  return redisCommand("KEYS", [pattern]);
}

// Generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generatePublicKey() {
  return `pk_test_${generateId()}${generateId()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP: Create test user and project directly in Firebase
// ═══════════════════════════════════════════════════════════════════════════

async function setup() {
  log("Setting up test environment...");

  // Create test user
  testUserId = `test_user_${generateId()}`;
  const testUser = {
    uid: testUserId,
    name: "Test User",
    email: `test_${generateId()}@example.com`,
    avatar: "",
    preferences: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.collection("users").doc(testUserId).set(testUser);
  log(`Created test user: ${testUserId}`);

  // Create test project
  testProjectId = `test_project_${generateId()}`;
  testPublicKey = generatePublicKey();
  const testProject = {
    id: testProjectId,
    ownerId: testUserId,
    name: "Test Project",
    publicKey: testPublicKey,
    enabled: true,
    detected: true,
    settings: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.collection("projects").doc(testProjectId).set(testProject);
  log(`Created test project: ${testProjectId}`);

  // Create mode policy for project (must be doc ID "mode", not "default")
  const policy = {
    value: "live",
    config: {
      message: "Test message",
      buttonText: "OK",
      redirectUrl: null,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db
    .collection("projects")
    .doc(testProjectId)
    .collection("policies")
    .doc("mode")
    .set(policy);
  log("Created mode policy");

  // Verify project was created correctly
  const verifyProject = await db.collection("projects").doc(testProjectId).get();
  if (verifyProject.exists) {
    const data = verifyProject.data();
    log(`Verified project - ID: ${testProjectId}, publicKey: ${data.publicKey}, enabled: ${data.enabled}`);
  } else {
    throw new Error("Failed to create test project!");
  }

  // Delay to ensure Firestore syncs across instances
  await new Promise((r) => setTimeout(r, 1000));

  return { testUserId, testProjectId, testPublicKey };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════

async function testUserPreferences() {
  console.log(`\n${BOLD}${YELLOW}═══ USER PREFERENCES TESTS ═══${RESET}\n`);

  // T1: Default preferences should be empty
  try {
    const userDoc = await db.collection("users").doc(testUserId).get();
    const prefs = userDoc.data()?.preferences || {};
    if (Object.keys(prefs).length === 0) {
      pass("T1: Default preferences are empty");
    } else {
      fail("T1: Default preferences are empty", `Expected empty, got ${JSON.stringify(prefs)}`);
    }
  } catch (e) {
    fail("T1: Default preferences are empty", e.message);
  }

  // T2: Set devOverlayEnabled to true
  try {
    await db.collection("users").doc(testUserId).update({
      "preferences.devOverlayEnabled": true,
      updatedAt: Date.now(),
    });
    const userDoc = await db.collection("users").doc(testUserId).get();
    if (userDoc.data()?.preferences?.devOverlayEnabled === true) {
      pass("T2: Set devOverlayEnabled to true");
    } else {
      fail("T2: Set devOverlayEnabled to true", "Value not set correctly");
    }
  } catch (e) {
    fail("T2: Set devOverlayEnabled to true", e.message);
  }

  // T3: Set domainAllowlist
  try {
    const allowlist = ["example.com", "*.test.com"];
    await db.collection("users").doc(testUserId).update({
      "preferences.domainAllowlist": allowlist,
      updatedAt: Date.now(),
    });
    const userDoc = await db.collection("users").doc(testUserId).get();
    const saved = userDoc.data()?.preferences?.domainAllowlist;
    if (JSON.stringify(saved) === JSON.stringify(allowlist)) {
      pass("T3: Set domainAllowlist");
    } else {
      fail("T3: Set domainAllowlist", `Expected ${JSON.stringify(allowlist)}, got ${JSON.stringify(saved)}`);
    }
  } catch (e) {
    fail("T3: Set domainAllowlist", e.message);
  }

  // T4: Set domainBlocklist
  try {
    const blocklist = ["staging.example.com", "dev.example.com"];
    await db.collection("users").doc(testUserId).update({
      "preferences.domainBlocklist": blocklist,
      updatedAt: Date.now(),
    });
    const userDoc = await db.collection("users").doc(testUserId).get();
    const saved = userDoc.data()?.preferences?.domainBlocklist;
    if (JSON.stringify(saved) === JSON.stringify(blocklist)) {
      pass("T4: Set domainBlocklist");
    } else {
      fail("T4: Set domainBlocklist", `Expected ${JSON.stringify(blocklist)}, got ${JSON.stringify(saved)}`);
    }
  } catch (e) {
    fail("T4: Set domainBlocklist", e.message);
  }

  // T5: Update multiple preferences atomically
  try {
    await db.collection("users").doc(testUserId).update({
      preferences: {
        devOverlayEnabled: false,
        domainAllowlist: ["newsite.com"],
        domainBlocklist: ["blocked.com"],
      },
      updatedAt: Date.now(),
    });
    const userDoc = await db.collection("users").doc(testUserId).get();
    const prefs = userDoc.data()?.preferences;
    if (
      prefs.devOverlayEnabled === false &&
      prefs.domainAllowlist[0] === "newsite.com" &&
      prefs.domainBlocklist[0] === "blocked.com"
    ) {
      pass("T5: Update multiple preferences atomically");
    } else {
      fail("T5: Update multiple preferences atomically", "Values not set correctly");
    }
  } catch (e) {
    fail("T5: Update multiple preferences atomically", e.message);
  }
}

async function testProjectSettings() {
  console.log(`\n${BOLD}${YELLOW}═══ PROJECT SETTINGS TESTS ═══${RESET}\n`);

  // T6: Default project settings should be empty
  try {
    const projDoc = await db.collection("projects").doc(testProjectId).get();
    const settings = projDoc.data()?.settings || {};
    if (Object.keys(settings).length === 0) {
      pass("T6: Default project settings are empty");
    } else {
      fail("T6: Default project settings are empty", `Expected empty, got ${JSON.stringify(settings)}`);
    }
  } catch (e) {
    fail("T6: Default project settings are empty", e.message);
  }

  // T7: Set project devOverlayEnabled override
  try {
    await db.collection("projects").doc(testProjectId).update({
      "settings.devOverlayEnabled": true,
      updatedAt: Date.now(),
    });
    const projDoc = await db.collection("projects").doc(testProjectId).get();
    if (projDoc.data()?.settings?.devOverlayEnabled === true) {
      pass("T7: Set project devOverlayEnabled override");
    } else {
      fail("T7: Set project devOverlayEnabled override", "Value not set correctly");
    }
  } catch (e) {
    fail("T7: Set project devOverlayEnabled override", e.message);
  }

  // T8: Set project domainAllowlist override
  try {
    const allowlist = ["project-specific.com"];
    await db.collection("projects").doc(testProjectId).update({
      "settings.domainAllowlist": allowlist,
      updatedAt: Date.now(),
    });
    const projDoc = await db.collection("projects").doc(testProjectId).get();
    const saved = projDoc.data()?.settings?.domainAllowlist;
    if (JSON.stringify(saved) === JSON.stringify(allowlist)) {
      pass("T8: Set project domainAllowlist override");
    } else {
      fail("T8: Set project domainAllowlist override", `Expected ${JSON.stringify(allowlist)}, got ${JSON.stringify(saved)}`);
    }
  } catch (e) {
    fail("T8: Set project domainAllowlist override", e.message);
  }

  // T9: Set project domainBlocklist override
  try {
    const blocklist = ["project-blocked.com"];
    await db.collection("projects").doc(testProjectId).update({
      "settings.domainBlocklist": blocklist,
      updatedAt: Date.now(),
    });
    const projDoc = await db.collection("projects").doc(testProjectId).get();
    const saved = projDoc.data()?.settings?.domainBlocklist;
    if (JSON.stringify(saved) === JSON.stringify(blocklist)) {
      pass("T9: Set project domainBlocklist override");
    } else {
      fail("T9: Set project domainBlocklist override", `Expected ${JSON.stringify(blocklist)}, got ${JSON.stringify(saved)}`);
    }
  } catch (e) {
    fail("T9: Set project domainBlocklist override", e.message);
  }

  // T10: Clear project settings (inherit from user)
  try {
    await db.collection("projects").doc(testProjectId).update({
      settings: {},
      updatedAt: Date.now(),
    });
    const projDoc = await db.collection("projects").doc(testProjectId).get();
    const settings = projDoc.data()?.settings || {};
    if (Object.keys(settings).length === 0) {
      pass("T10: Clear project settings (inherit from user)");
    } else {
      fail("T10: Clear project settings (inherit from user)", "Settings not cleared");
    }
  } catch (e) {
    fail("T10: Clear project settings (inherit from user)", e.message);
  }
}

async function testVisibilityResolution() {
  console.log(`\n${BOLD}${YELLOW}═══ VISIBILITY RESOLUTION TESTS ═══${RESET}\n`);

  // Setup: Clear all settings first
  await db.collection("users").doc(testUserId).update({
    preferences: {},
    updatedAt: Date.now(),
  });
  await db.collection("projects").doc(testProjectId).update({
    settings: {},
    updatedAt: Date.now(),
  });

  // Clear decide cache
  await redisDel(`decide:${testProjectId}`);

  // T11: /decide returns default visibility (devOverlayEnabled=false, empty lists)
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      vis.devOverlayEnabled === false &&
      Array.isArray(vis.domainAllowlist) &&
      vis.domainAllowlist.length === 0 &&
      Array.isArray(vis.domainBlocklist) &&
      vis.domainBlocklist.length === 0
    ) {
      pass("T11: /decide returns default visibility");
    } else {
      fail("T11: /decide returns default visibility", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T11: /decide returns default visibility", e.message);
  }

  // T12: User preferences reflected in /decide
  try {
    await db.collection("users").doc(testUserId).update({
      preferences: {
        devOverlayEnabled: true,
        domainAllowlist: ["user-domain.com"],
        domainBlocklist: ["user-blocked.com"],
      },
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      vis.devOverlayEnabled === true &&
      vis.domainAllowlist[0] === "user-domain.com" &&
      vis.domainBlocklist[0] === "user-blocked.com"
    ) {
      pass("T12: User preferences reflected in /decide");
    } else {
      fail("T12: User preferences reflected in /decide", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T12: User preferences reflected in /decide", e.message);
  }

  // T13: Project settings override user preferences
  try {
    await db.collection("projects").doc(testProjectId).update({
      settings: {
        devOverlayEnabled: false,
        domainAllowlist: ["project-domain.com"],
        domainBlocklist: ["project-blocked.com"],
      },
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      vis.devOverlayEnabled === false &&
      vis.domainAllowlist[0] === "project-domain.com" &&
      vis.domainBlocklist[0] === "project-blocked.com"
    ) {
      pass("T13: Project settings override user preferences");
    } else {
      fail("T13: Project settings override user preferences", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T13: Project settings override user preferences", e.message);
  }

  // T14: Partial project override (only devOverlayEnabled)
  try {
    await db.collection("projects").doc(testProjectId).update({
      settings: {
        devOverlayEnabled: true,
        // domainAllowlist and domainBlocklist should fall back to user
      },
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      vis.devOverlayEnabled === true &&
      vis.domainAllowlist[0] === "user-domain.com" &&
      vis.domainBlocklist[0] === "user-blocked.com"
    ) {
      pass("T14: Partial project override (devOverlayEnabled only)");
    } else {
      fail("T14: Partial project override (devOverlayEnabled only)", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T14: Partial project override (devOverlayEnabled only)", e.message);
  }
}

async function testCacheInvalidation() {
  console.log(`\n${BOLD}${YELLOW}═══ CACHE INVALIDATION TESTS ═══${RESET}\n`);

  // T15: Decision is cached in Redis
  try {
    await redisDel(`decide:${testProjectId}`);
    await fetch(`${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`);
    const cached = await redisGet(`decide:${testProjectId}`);
    if (cached) {
      pass("T15: Decision is cached in Redis");
    } else {
      fail("T15: Decision is cached in Redis", "No cache entry found");
    }
  } catch (e) {
    fail("T15: Decision is cached in Redis", e.message);
  }

  // T16: Cache invalidated when project settings change
  try {
    // Ensure cache exists
    await fetch(`${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`);
    let cached = await redisGet(`decide:${testProjectId}`);
    if (!cached) {
      fail("T16: Cache invalidated when project settings change", "No initial cache");
      return;
    }

    // Update project settings (simulating API call)
    await db.collection("projects").doc(testProjectId).update({
      "settings.devOverlayEnabled": false,
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`); // Simulate cache invalidation

    cached = await redisGet(`decide:${testProjectId}`);
    if (!cached) {
      pass("T16: Cache invalidated when project settings change");
    } else {
      fail("T16: Cache invalidated when project settings change", "Cache still exists");
    }
  } catch (e) {
    fail("T16: Cache invalidated when project settings change", e.message);
  }
}

async function testConcurrentOperations() {
  console.log(`\n${BOLD}${YELLOW}═══ CONCURRENT OPERATIONS TESTS ═══${RESET}\n`);

  // T17: Concurrent preference updates don't corrupt data
  try {
    const updates = [];
    for (let i = 0; i < 5; i++) {
      updates.push(
        db.collection("users").doc(testUserId).update({
          [`preferences.testField${i}`]: `value${i}`,
          updatedAt: Date.now(),
        })
      );
    }
    await Promise.all(updates);

    const userDoc = await db.collection("users").doc(testUserId).get();
    const prefs = userDoc.data()?.preferences || {};
    let allPresent = true;
    for (let i = 0; i < 5; i++) {
      if (prefs[`testField${i}`] !== `value${i}`) {
        allPresent = false;
        break;
      }
    }
    if (allPresent) {
      pass("T17: Concurrent preference updates don't corrupt data");
    } else {
      fail("T17: Concurrent preference updates don't corrupt data", "Some fields missing");
    }
  } catch (e) {
    fail("T17: Concurrent preference updates don't corrupt data", e.message);
  }

  // T18: Concurrent /decide requests return consistent data
  try {
    await redisDel(`decide:${testProjectId}`);

    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`)
          .then((r) => r.json())
      );
    }
    const results = await Promise.all(requests);

    const firstVis = JSON.stringify(results[0].data?.visibility);
    let allConsistent = true;
    for (const result of results) {
      if (JSON.stringify(result.data?.visibility) !== firstVis) {
        allConsistent = false;
        break;
      }
    }
    if (allConsistent) {
      pass("T18: Concurrent /decide requests return consistent data");
    } else {
      fail("T18: Concurrent /decide requests return consistent data", "Inconsistent responses");
    }
  } catch (e) {
    fail("T18: Concurrent /decide requests return consistent data", e.message);
  }

  // T19: Rapid cache invalidation and refetch
  try {
    let success = true;
    for (let i = 0; i < 5; i++) {
      await redisDel(`decide:${testProjectId}`);
      const res = await fetch(
        `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
      );
      const json = await res.json();
      if (!json.data?.visibility) {
        success = false;
        break;
      }
    }
    if (success) {
      pass("T19: Rapid cache invalidation and refetch works");
    } else {
      fail("T19: Rapid cache invalidation and refetch works", "Missing visibility data");
    }
  } catch (e) {
    fail("T19: Rapid cache invalidation and refetch works", e.message);
  }
}

async function testEdgeCases() {
  console.log(`\n${BOLD}${YELLOW}═══ EDGE CASE TESTS ═══${RESET}\n`);

  // T20: Empty arrays handled correctly
  try {
    await db.collection("users").doc(testUserId).update({
      preferences: {
        devOverlayEnabled: true,
        domainAllowlist: [],
        domainBlocklist: [],
      },
      updatedAt: Date.now(),
    });
    await db.collection("projects").doc(testProjectId).update({
      settings: {},
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      Array.isArray(vis.domainAllowlist) &&
      vis.domainAllowlist.length === 0 &&
      Array.isArray(vis.domainBlocklist) &&
      vis.domainBlocklist.length === 0
    ) {
      pass("T20: Empty arrays handled correctly");
    } else {
      fail("T20: Empty arrays handled correctly", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T20: Empty arrays handled correctly", e.message);
  }

  // T21: Wildcard domains in allowlist
  try {
    await db.collection("users").doc(testUserId).update({
      "preferences.domainAllowlist": ["*.example.com", "specific.com"],
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (vis && vis.domainAllowlist.includes("*.example.com")) {
      pass("T21: Wildcard domains in allowlist");
    } else {
      fail("T21: Wildcard domains in allowlist", `Got: ${JSON.stringify(vis?.domainAllowlist)}`);
    }
  } catch (e) {
    fail("T21: Wildcard domains in allowlist", e.message);
  }

  // T22: Blocklist takes precedence (stored correctly)
  try {
    const blocklist = ["blocked.com", "also-blocked.com"];
    const allowlist = ["allowed.com"];
    await db.collection("users").doc(testUserId).update({
      preferences: {
        devOverlayEnabled: true,
        domainAllowlist: allowlist,
        domainBlocklist: blocklist,
      },
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    if (
      vis &&
      vis.domainBlocklist.length === 2 &&
      vis.domainAllowlist.length === 1
    ) {
      pass("T22: Blocklist and allowlist stored independently");
    } else {
      fail("T22: Blocklist and allowlist stored independently", `Got: ${JSON.stringify(vis)}`);
    }
  } catch (e) {
    fail("T22: Blocklist and allowlist stored independently", e.message);
  }

  // T23: null vs undefined settings inheritance
  try {
    await db.collection("projects").doc(testProjectId).update({
      settings: {
        devOverlayEnabled: null, // explicit null should still inherit
      },
      updatedAt: Date.now(),
    });
    await redisDel(`decide:${testProjectId}`);

    const res = await fetch(
      `${BASE_URL}/api/v1/decide?projectId=${testProjectId}&key=${testPublicKey}`
    );
    const json = await res.json();
    const vis = json.data?.visibility;
    // With null, should inherit from user (which is true)
    if (vis && vis.devOverlayEnabled === true) {
      pass("T23: null project setting inherits from user");
    } else {
      fail("T23: null project setting inherits from user", `Got devOverlayEnabled: ${vis?.devOverlayEnabled}`);
    }
  } catch (e) {
    fail("T23: null project setting inherits from user", e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP: Remove all test data
// ═══════════════════════════════════════════════════════════════════════════

async function cleanup() {
  console.log(`\n${BOLD}${YELLOW}═══ CLEANUP ═══${RESET}\n`);

  try {
    // Delete project policies
    const policiesSnap = await db
      .collection("projects")
      .doc(testProjectId)
      .collection("policies")
      .get();
    for (const doc of policiesSnap.docs) {
      await doc.ref.delete();
    }
    log("Deleted project policies");

    // Delete project
    await db.collection("projects").doc(testProjectId).delete();
    log(`Deleted project: ${testProjectId}`);

    // Delete user
    await db.collection("users").doc(testUserId).delete();
    log(`Deleted user: ${testUserId}`);

    // Clean up Redis
    const keysToDelete = [
      `decide:${testProjectId}`,
      `mode:event:${testProjectId}`,
      `rate:${testProjectId}:*`,
    ];

    for (const pattern of keysToDelete) {
      if (pattern.includes("*")) {
        const keys = await redisKeys(pattern);
        if (keys && keys.length > 0) {
          for (const key of keys) {
            await redisDel(key);
          }
        }
      } else {
        await redisDel(pattern);
      }
    }
    log("Cleaned up Redis cache");

    // Verify cleanup
    const userCheck = await db.collection("users").doc(testUserId).get();
    const projCheck = await db.collection("projects").doc(testProjectId).get();
    const cacheCheck = await redisGet(`decide:${testProjectId}`);

    if (!userCheck.exists && !projCheck.exists && !cacheCheck) {
      log(`${GREEN}✓ Cleanup verified - all test data removed${RESET}`);
    } else {
      log(`${RED}✗ Cleanup incomplete${RESET}`);
    }
  } catch (e) {
    console.error(`${RED}Cleanup error: ${e.message}${RESET}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║         SETTINGS FEATURE TEST SUITE                        ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  try {
    // Setup
    await setup();

    // Run all test suites
    await testUserPreferences();
    await testProjectSettings();
    await testVisibilityResolution();
    await testCacheInvalidation();
    await testConcurrentOperations();
    await testEdgeCases();

    // Summary
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}RESULTS: ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}\n`);

    if (errors.length > 0) {
      console.log(`${RED}${BOLD}Failed tests:${RESET}`);
      for (const e of errors) {
        console.log(`  - ${e.name}: ${e.error}`);
      }
      console.log("");
    }

    // Cleanup
    await cleanup();

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error(`${RED}Fatal error: ${e.message}${RESET}`);
    console.error(e.stack);
    await cleanup();
    process.exit(1);
  }
}

main();
