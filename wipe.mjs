#!/usr/bin/env node
// Switchyy — Full Environment Wipe
// Deletes ALL Firestore projects (+ subcollections) and flushes all Redis keys.
// Usage: node wipe.mjs
// ⚠️  DESTRUCTIVE — only run against a test/staging environment.

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── .env.local parser (same as test.mjs) ─────────────────────────────────────
function loadDotenv(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf8");
  const result = {};
  let i = 0;
  while (i < content.length) {
    while (i < content.length && "\r\n ".includes(content[i])) i++;
    if (i >= content.length) break;
    if (content[i] === "#") { while (i < content.length && content[i] !== "\n") i++; continue; }
    let keyEnd = i;
    while (keyEnd < content.length && content[keyEnd] !== "=" && content[keyEnd] !== "\n") keyEnd++;
    if (content[keyEnd] !== "=") { i = keyEnd + 1; continue; }
    const key = content.slice(i, keyEnd).trim();
    i = keyEnd + 1;
    let value = "";
    if (i < content.length && (content[i] === '"' || content[i] === "'")) {
      const q = content[i++];
      while (i < content.length && content[i] !== q) {
        if (content[i] === "\\" && i + 1 < content.length) {
          const n = content[i + 1];
          if (n === "n") { value += "\n"; i += 2; }
          else if (n === "r") { value += "\r"; i += 2; }
          else if (n === "\\" || n === '"' || n === "'") { value += n; i += 2; }
          else { value += content[i++]; }
        } else { value += content[i++]; }
      }
      i++;
    } else {
      while (i < content.length && content[i] !== "\n" && content[i] !== "\r") value += content[i++];
      value = value.trim();
    }
    if (key) result[key] = value;
  }
  return result;
}

const ENV = { ...loadDotenv(join(__dirname, ".env.local")), ...process.env };

// ── Production guard ──────────────────────────────────────────────────────────
if (ENV.NODE_ENV === "production") {
  console.error("❌ FATAL: NODE_ENV=production — refusing to wipe a production environment.");
  process.exit(1);
}

const FIREBASE_PROJECT_ID = ENV.FIREBASE_PROJECT_ID || "";
const FIREBASE_CLIENT_EMAIL = ENV.FIREBASE_CLIENT_EMAIL || "";
const FIREBASE_PRIVATE_KEY = ENV.FIREBASE_PRIVATE_KEY || "";
const UPSTASH_URL = ENV.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = ENV.UPSTASH_REDIS_REST_TOKEN || "";

for (const [k, v] of Object.entries({ FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, UPSTASH_URL, UPSTASH_TOKEN })) {
  if (!v) { console.error(`❌ FATAL: Missing credential: ${k}`); process.exit(1); }
}

// ── Firebase Admin ────────────────────────────────────────────────────────────
let admin;
try {
  admin = require("firebase-admin");
} catch {
  console.error("❌ FATAL: firebase-admin not found. Run: npm install");
  process.exit(1);
}

const fbApp = admin.initializeApp(
  { credential: admin.credential.cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY }) },
  `switchy-wipe-${Date.now()}`
);
const db = admin.firestore(fbApp);

// ── Redis via Upstash REST ────────────────────────────────────────────────────
async function redisCmd(...args) {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  return res.json();
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
const SUBCOLLECTIONS = ["policies"];

async function deleteProject(projectId) {
  for (const sub of SUBCOLLECTIONS) {
    const snap = await db.collection("projects").doc(projectId).collection(sub).get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }
  }
  await db.collection("projects").doc(projectId).delete();
}

// ── Wipe Firestore ────────────────────────────────────────────────────────────
async function wipeFirestore() {
  console.log("\n[Firestore] Scanning projects collection...");
  const snap = await db.collection("projects").get();
  if (snap.empty) {
    console.log("  (empty — nothing to delete)");
    return 0;
  }
  console.log(`  Found ${snap.docs.length} project(s). Deleting...`);
  let deleted = 0;
  for (const doc of snap.docs) {
    const id = doc.id;
    try {
      await deleteProject(id);
      console.log(`  ✅ Deleted project: ${id}`);
      deleted++;
    } catch (e) {
      console.warn(`  ⚠️  Failed to delete ${id}: ${e.message}`);
    }
  }
  return deleted;
}

// ── Wipe Redis ────────────────────────────────────────────────────────────────
async function wipeRedis() {
  console.log("\n[Redis] Flushing all keys...");

  // FLUSHDB wipes the current database — cleanest approach
  const result = await redisCmd("FLUSHDB");
  if (result.result === "OK" || result.result === "ok") {
    console.log("  ✅ FLUSHDB — all Redis keys deleted");
    return true;
  }

  // Fallback: KEYS * + DEL if FLUSHDB is restricted
  console.log("  FLUSHDB returned unexpected result, falling back to KEYS * + DEL...");
  const keysResult = await redisCmd("KEYS", "*");
  const keys = keysResult.result || [];
  if (keys.length === 0) {
    console.log("  (empty — nothing to delete)");
    return true;
  }
  console.log(`  Found ${keys.length} key(s). Deleting...`);
  const delResult = await redisCmd("DEL", ...keys);
  console.log(`  ✅ Deleted ${delResult.result} Redis key(s)`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Switchyy — Full Environment Wipe");
  console.log("  Firebase project:", FIREBASE_PROJECT_ID);
  console.log("  Redis endpoint  :", UPSTASH_URL.replace(/\/\/.*@/, "//***@"));
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n⚠️  This will DELETE ALL data. Proceeding in 3 seconds...");
  await new Promise((r) => setTimeout(r, 3000));

  let ok = true;

  try {
    const count = await wipeFirestore();
    console.log(`\n  Firestore: ${count} project(s) deleted`);
  } catch (e) {
    console.error(`\n  ❌ Firestore wipe failed: ${e.message}`);
    ok = false;
  }

  try {
    await wipeRedis();
  } catch (e) {
    console.error(`\n  ❌ Redis wipe failed: ${e.message}`);
    ok = false;
  }

  try { await fbApp.delete(); } catch { /* ignore */ }

  console.log("\n═══════════════════════════════════════════════════════");
  if (ok) {
    console.log("  ✅ Environment wiped. Ready for fresh client testing.");
  } else {
    console.log("  ⚠️  Wipe completed with errors — check output above.");
  }
  console.log("═══════════════════════════════════════════════════════");
  process.exit(ok ? 0 : 1);
}

main();
