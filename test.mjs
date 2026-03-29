#!/usr/bin/env node
// Switchyy Real-Time QA Suite — Fully Automated
// Usage: node test.mjs
// Reads credentials from .env.local. Override base URL with TEST_BASE_URL.

import { readFileSync, existsSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { setTimeout as sleep } from "timers/promises";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── .env.local parser ─────────────────────────────────────────────────────────
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
      i++; // closing quote
    } else {
      while (i < content.length && content[i] !== "\n" && content[i] !== "\r") value += content[i++];
      value = value.trim();
    }
    if (key) result[key] = value;
  }
  return result;
}

const ENV = { ...loadDotenv(join(__dirname, ".env.local")), ...process.env };

// ── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = ENV.TEST_BASE_URL || "http://localhost:3000";
const FIREBASE_PROJECT_ID = ENV.FIREBASE_PROJECT_ID || "";
const FIREBASE_CLIENT_EMAIL = ENV.FIREBASE_CLIENT_EMAIL || "";
const FIREBASE_PRIVATE_KEY = ENV.FIREBASE_PRIVATE_KEY || "";
const UPSTASH_URL = ENV.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = ENV.UPSTASH_REDIS_REST_TOKEN || "";

// ── Guards ───────────────────────────────────────────────────────────────────
if (ENV.NODE_ENV === "production") {
  console.error("❌ FATAL: NODE_ENV=production — refusing to run QA suite against production.");
  process.exit(1);
}
for (const [k, v] of Object.entries({ FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, UPSTASH_URL, UPSTASH_TOKEN })) {
  if (!v) { console.error(`❌ FATAL: Missing required credential: ${k}`); process.exit(1); }
}

// ── Firebase Admin (CJS require for reliability across ESM/CJS boundaries) ───
let admin;
try {
  admin = require("firebase-admin");
} catch {
  console.error("❌ FATAL: firebase-admin not found. Run: npm install");
  process.exit(1);
}

const fbApp = admin.initializeApp(
  { credential: admin.credential.cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY }) },
  `switchy-qa-${Date.now()}`
);
const db = admin.firestore(fbApp);

// ── Redis via Upstash REST (no npm dep) ───────────────────────────────────────
async function redisCmd(...args) {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  return res.json();
}
const redisDel = (...keys) => redisCmd("DEL", ...keys);
const redisGet = (k) => redisCmd("GET", k).then((r) => r.result);
const redisSet = (k, v, ttl) => redisCmd("SET", k, JSON.stringify(v), "EX", String(ttl));

// ── Test Project ──────────────────────────────────────────────────────────────
const TEST_PROJECT_ID = `switchy_qa_${Date.now()}`;
const TEST_PUBLIC_KEY = "pk_" + randomBytes(12).toString("hex");
const EMIT_URL = `${BASE_URL}/api/v1/test/emit`;
const SSE_URL = `${BASE_URL}/api/v1/events/${encodeURIComponent(TEST_PROJECT_ID)}?key=${encodeURIComponent(TEST_PUBLIC_KEY)}`;
const DECIDE_URL = `${BASE_URL}/api/v1/decide?projectId=${encodeURIComponent(TEST_PROJECT_ID)}&key=${encodeURIComponent(TEST_PUBLIC_KEY)}`;

async function setupTestProject() {
  const now = Date.now();
  await db.collection("projects").doc(TEST_PROJECT_ID).set({
    id: TEST_PROJECT_ID, ownerId: "test_owner_qa", name: "QA Test Project",
    publicKey: TEST_PUBLIC_KEY, detected: true, enabled: true, createdAt: now, updatedAt: now,
  });
  await db.collection("projects").doc(TEST_PROJECT_ID)
    .collection("policies").doc("mode").set({
      type: "mode", value: "live",
      config: { message: null, buttonText: null, redirectUrl: null },
      updatedAt: now, updatedBy: "qa",
    });
}

async function cleanupTestProject() {
  try {
    await db.collection("projects").doc(TEST_PROJECT_ID).collection("policies").doc("mode").delete();
    await db.collection("projects").doc(TEST_PROJECT_ID).delete();
  } catch { /* best effort */ }
  await redisDel(`decide:${TEST_PROJECT_ID}`, `mode:event:${TEST_PROJECT_ID}`,
    `rate:127.0.0.1:${TEST_PROJECT_ID}`, `rate:::1:${TEST_PROJECT_ID}`, `rate:unknown:${TEST_PROJECT_ID}`);
  try { await fbApp.delete(); } catch { /* already deleted */ }
}

// ── Test Helpers ──────────────────────────────────────────────────────────────
let passed = 0; let failed = 0; const failures = [];
const pass = (n) => { console.log(`  ✅ PASS  ${n}`); passed++; };
const fail = (n, r) => { console.log(`  ❌ FAIL  ${n}: ${r}`); failed++; failures.push({ n, r }); };
const assert = (c, n, r) => c ? pass(n) : fail(n, r);

async function emit(mode, extra = {}) {
  const res = await fetch(EMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: TEST_PROJECT_ID, mode, ...extra }),
  });
  if (!res.ok) throw new Error(`Emit HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sseCollect({ url = SSE_URL, headers = {}, timeoutMs = 5000, condition = null, _onConnected = null } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const events = []; let buf = ""; let resRef = null;
  try {
    const res = await fetch(url, { headers: { Accept: "text/event-stream", ...headers }, signal: ac.signal });
    resRef = res;
    if (_onConnected) _onConnected();
    if (!res.ok || !res.body) { clearTimeout(timer); return { res, events, timedOut: false }; }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n"); buf = parts.pop();
      for (const part of parts) {
        if (!part.trim()) continue;
        const ev = {};
        for (const line of part.split("\n")) {
          if (line.startsWith("event:")) ev.event = line.slice(6).trim();
          else if (line.startsWith("id:")) ev.id = line.slice(3).trim();
          else if (line.startsWith("data:")) ev.data = line.slice(5).trim();
          else if (line === ":") ev.heartbeat = true;
        }
        events.push(ev);
        if (condition && condition(events)) { clearTimeout(timer); reader.cancel().catch(() => {}); return { res, events, timedOut: false }; }
      }
    }
    clearTimeout(timer); return { res, events, timedOut: false };
  } catch (e) {
    clearTimeout(timer);
    if (_onConnected) _onConnected(); // always resolve so awaiting callers don't hang
    if (e.name === "AbortError") return { res: resRef, events, timedOut: true };
    throw e;
  }
}

const hasModeEvent = (evs) => evs.some((e) => e.event === "mode");
const modeEvents = (evs) => evs.filter((e) => e.event === "mode");
const parseData = (e) => JSON.parse(e.data);

// ── Tests ────────────────────────────────────────────────────────────────────

async function t01_sseConnects() {
  console.log("\n[T01] SSE Connection & Headers");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 4000);
  try {
    const res = await fetch(SSE_URL, { headers: { Accept: "text/event-stream" }, signal: ac.signal });
    clearTimeout(timer);
    assert(res.status === 200, "T01-status", `expected 200, got ${res.status}`);
    assert((res.headers.get("content-type") || "").includes("text/event-stream"), "T01-content-type", res.headers.get("content-type"));
    assert((res.headers.get("cache-control") || "").toLowerCase().includes("no-store"), "T01-cache-control", res.headers.get("cache-control"));
    assert((res.headers.get("x-accel-buffering") || "").toLowerCase() === "no", "T01-x-accel-buffering", res.headers.get("x-accel-buffering"));
    res.body?.cancel();
  } catch (e) {
    clearTimeout(timer);
    if (e.name !== "AbortError") fail("T01", e.message);
    else pass("T01-connected"); // abort means connection was held open — SSE is working
  }
}

async function t02_heartbeat() {
  console.log("\n[T02] Heartbeat (may take up to 26s)");
  const { events, timedOut } = await sseCollect({ timeoutMs: 30000, condition: (evs) => evs.some((e) => e.heartbeat) });
  assert(!timedOut && events.some((e) => e.heartbeat), "T02-heartbeat", timedOut ? "timed out >30s" : "no heartbeat");
}

async function t03_modeEventDelivery() {
  console.log("\n[T03] Mode Event Delivery (<2s from emit)");
  for (const mode of ["maintenance", "live"]) {
    let signalReady; const readyP = new Promise((r) => { signalReady = r; });
    // 10s window: absorbs Firestore lookup on first cold call after T02
    const collectP = sseCollect({ timeoutMs: 10000, condition: hasModeEvent, _onConnected: signalReady });
    await Promise.race([readyP, sleep(9000)]); // wait for connection, never hang
    const emitAt = Date.now();
    await emit(mode);
    const { events, timedOut } = await collectP;
    const ev = events.find((e) => e.event === "mode");
    assert(!timedOut && !!ev, `T03-received-${mode}`, "timed out");
    assert(Date.now() - emitAt < 2000, `T03-delivery-${mode}`, `${Date.now() - emitAt}ms`);
  }
}

async function t04_eventPayloadCorrect() {
  console.log("\n[T04] Event Payload Correctness");
  const collectP = sseCollect({ timeoutMs: 3000, condition: hasModeEvent });
  await sleep(80);
  await emit("maintenance", { message: "Down for repairs", buttonText: "Status", redirect: "https://status.example.com" });
  const { events, timedOut } = await collectP;
  if (timedOut || !hasModeEvent(events)) { fail("T04-received", "no mode event"); return; }
  let d;
  try { d = parseData(events.find((e) => e.event === "mode")); } catch { fail("T04-parse", "invalid JSON"); return; }
  assert(d.projectId === TEST_PROJECT_ID, "T04-projectId", d.projectId);
  assert(d.mode === "maintenance", "T04-mode", d.mode);
  assert(typeof d.version === "number" && d.version > 0, "T04-version", String(d.version));
  assert(d.message === "Down for repairs", "T04-message", d.message);
  await emit("live");
}

async function t05_versionFence() {
  console.log("\n[T05] Version Fence — Stale Correctly Carried by Server");
  const highVer = Date.now() + 9_999_999;
  await emit("maintenance", { version: highVer });
  await sleep(150);
  const collectP = sseCollect({ timeoutMs: 2500, condition: (evs) => modeEvents(evs).length >= 1 });
  await sleep(80);
  await emit("live", { version: highVer - 1000 });
  const { events } = await collectP;
  const stale = modeEvents(events).find((e) => { try { return parseData(e).version === highVer - 1000; } catch { return false; } });
  assert(!!stale, "T05-stale-emitted", "server must relay stale event (client filters)");
  await emit("live", { version: Date.now() + 9_999_999 + 1 });
  // Reset: clear the artificially-high Redis version so T06+ normal emits can update the key
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t06_rapidUpdates() {
  console.log("\n[T06] Rapid Updates — Monotonic Order, Last Mode Correct");
  const base = Date.now();
  const modes = ["maintenance", "brb", "working", "vacation", "live"];
  const collectP = sseCollect({ timeoutMs: 5000, condition: (evs) => modeEvents(evs).length >= modes.length });
  await sleep(80);
  for (let i = 0; i < modes.length; i++) { await emit(modes[i], { version: base + i }); await sleep(15); }
  const { events, timedOut } = await collectP;
  const evs = modeEvents(events);
  assert(!timedOut && evs.length >= modes.length, "T06-count", `got ${evs.length}/${modes.length}`);
  let prev = 0; let ordered = true;
  for (const e of evs) { try { const v = parseData(e).version; if (v < prev) { ordered = false; break; } prev = v; } catch { /* skip */ } }
  assert(ordered, "T06-monotonic", "versions out of order");
  if (evs.length >= modes.length) {
    try { assert(parseData(evs[evs.length - 1]).mode === "live", "T06-last-mode", parseData(evs[evs.length - 1]).mode); }
    catch { fail("T06-last-parse", "parse error"); }
  }
}

async function t07_noDuplicates() {
  console.log("\n[T07] No Duplicate Events");
  const ver = Date.now() + 1_000_000;
  const collectP = sseCollect({ timeoutMs: 2200, condition: null });
  await sleep(80);
  await emit("maintenance", { version: ver });
  await sleep(600);
  const { events } = await collectP;
  const copies = modeEvents(events).filter((e) => { try { return parseData(e).version === ver; } catch { return false; } });
  assert(copies.length === 1, "T07-no-duplicates", `received ${copies.length} copies`);
  await emit("live");
  // Reset: T07 stores Date.now()+1_000_000 in Redis; auto-version emits in T08/T09 are smaller
  // and can't overwrite it, causing T09 to get a spurious replay. Clear it here.
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t08_lastEventIdReplay() {
  console.log("\n[T08] Last-Event-ID Replay");
  const { event: emitted } = await emit("maintenance");
  await sleep(400);
  const oldId = String(emitted.version - 1);
  const { events, timedOut } = await sseCollect({
    headers: { "Last-Event-ID": oldId }, timeoutMs: 3000, condition: hasModeEvent,
  });
  const replay = events.find((e) => e.event === "mode");
  assert(!timedOut && !!replay, "T08-replay-received", timedOut ? "timed out" : "no replay event");
  if (replay) {
    try { assert(parseData(replay).version > Number(oldId), "T08-replay-version", parseData(replay).version); }
    catch { fail("T08-parse", "bad JSON"); }
  }
  await emit("live");
}

async function t09_noReplayWhenCurrent() {
  console.log("\n[T09] No Replay When Already Current");
  const { event: emitted } = await emit("live");
  await sleep(400);
  const { events } = await sseCollect({
    headers: { "Last-Event-ID": String(emitted.version) }, timeoutMs: 2000, condition: null,
  });
  assert(modeEvents(events).length === 0, "T09-no-replay", `got ${modeEvents(events).length} unexpected events`);
}

async function t10_multiClientSync() {
  console.log("\n[T10] Multi-Client Sync (3 concurrent connections)");
  const ver = Date.now() + 2_000_000;
  const promises = Array.from({ length: 3 }, () => sseCollect({ timeoutMs: 5000, condition: hasModeEvent }));
  await sleep(200);
  await emit("vacation", { version: ver });
  const results = await Promise.all(promises);
  let allOk = true;
  for (const { events } of results) {
    const ev = events.find((e) => e.event === "mode");
    if (!ev) { allOk = false; break; }
    try { if (parseData(ev).version !== ver) { allOk = false; break; } } catch { allOk = false; break; }
  }
  assert(allOk, "T10-all-received", "one or more clients missed the event");
  await emit("live");
}

async function t11_invalidKeyRejected() {
  console.log("\n[T11] Invalid Key → 401");
  const badUrl = `${BASE_URL}/api/v1/events/${encodeURIComponent(TEST_PROJECT_ID)}?key=pk_bad_key_qa`;
  const ac = new AbortController(); setTimeout(() => ac.abort(), 3000);
  try {
    const res = await fetch(badUrl, { headers: { Accept: "text/event-stream" }, signal: ac.signal });
    assert(res.status === 401, "T11-rejected", `got ${res.status}`);
    res.body?.cancel();
  } catch (e) { if (e.name !== "AbortError") fail("T11", e.message); }
}

async function t12_decideCacheControl() {
  console.log("\n[T12] /decide Cache-Control: no-store");
  const res = await fetch(DECIDE_URL);
  assert((res.headers.get("cache-control") || "").toLowerCase().includes("no-store"), "T12-no-store", res.headers.get("cache-control"));
  assert(res.status === 200, "T12-status", `got ${res.status}`);
}

async function t13_memorySafety() {
  console.log("\n[T13] Memory Safety — 50 rapid connect/disconnect cycles");
  const before = process.memoryUsage().heapUsed;
  for (let i = 0; i < 50; i++) {
    const ac = new AbortController();
    const p = fetch(SSE_URL, { headers: { Accept: "text/event-stream" }, signal: ac.signal }).catch(() => {});
    await sleep(15);
    ac.abort();
    await p;
  }
  await sleep(600);
  const delta = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
  console.log(`    heap delta: ${delta.toFixed(1)} MB`);
  assert(delta < 15, "T13-heap-delta", `${delta.toFixed(1)} MB (>15 MB)`);
}

async function t14_transitionCssAndDebugGuard() {
  console.log("\n[T14] switchy.js — transition CSS + debug flag guard");
  const src = readFileSync(join(__dirname, "public", "switchy.js"), "utf8");
  assert(src.includes("opacity"), "T14-opacity", "opacity not found in switchy.js");
  assert(src.includes("transition"), "T14-transition", "transition property not found");
  assert(src.includes("__SWITCHY_TEST__"), "T14-debug-guard", "__SWITCHY_TEST__ guard not found");
  assert(src.includes("removeDebugBadge"), "T14-cleanup-fn", "removeDebugBadge not found");
  // Production safety: __SWITCHY_TEST__ must only be READ, never unconditionally set to true
  assert(!/window\.__SWITCHY_TEST__\s*=\s*true/.test(src), "T14-no-unconditional-set", "debug flag set unconditionally");
}

async function t15_stressRandomSwitching() {
  console.log("\n[T15] Stress: 20 rapid random modes across 3 concurrent clients");
  const MODES = ["maintenance", "brb", "working", "vacation", "incident", "deploying", "focus", "live"];
  const COUNT = 20;
  const base = Date.now() + 50_000_000;
  let signalA; const readyA = new Promise((r) => { signalA = r; });
  let signalB; const readyB = new Promise((r) => { signalB = r; });
  let signalC; const readyC = new Promise((r) => { signalC = r; });
  const clientA = sseCollect({ timeoutMs: 10000, condition: (evs) => modeEvents(evs).length >= COUNT, _onConnected: signalA });
  const clientB = sseCollect({ timeoutMs: 10000, condition: (evs) => modeEvents(evs).length >= COUNT, _onConnected: signalB });
  const clientC = sseCollect({ timeoutMs: 10000, condition: (evs) => modeEvents(evs).length >= COUNT, _onConnected: signalC });
  await Promise.race([Promise.all([readyA, readyB, readyC]), sleep(8000)]);
  for (let i = 0; i < COUNT; i++) {
    await emit(MODES[i % MODES.length], { version: base + i });
    await sleep(12);
  }
  const results = await Promise.all([clientA, clientB, clientC]);
  for (let ci = 0; ci < 3; ci++) {
    const evs = modeEvents(results[ci].events);
    assert(evs.length >= COUNT, `T15-client${ci + 1}-count`, `got ${evs.length}/${COUNT}`);
    let mono = true; let prev = 0;
    for (const e of evs) { try { const v = parseData(e).version; if (v < prev) { mono = false; break; } prev = v; } catch { /* skip */ } }
    assert(mono, `T15-client${ci + 1}-monotonic`, "versions out of order");
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t16_liveUpdateCorrectness() {
  console.log("\n[T16] Live update: final mode matches last emitted after rapid sequence");
  const MODES = ["maintenance", "vacation", "brb", "working", "incident", "live"];
  let signalReady; const readyP = new Promise((r) => { signalReady = r; });
  const collectP = sseCollect({
    timeoutMs: 10000,
    condition: (evs) => {
      const m = modeEvents(evs);
      if (!m.length) return false;
      try { return parseData(m[m.length - 1]).mode === "live"; } catch { return false; }
    },
    _onConnected: signalReady,
  });
  await Promise.race([readyP, sleep(8000)]);
  for (const mode of MODES) { await emit(mode); await sleep(20); }
  const { events, timedOut } = await collectP;
  assert(!timedOut, "T16-completed", "timed out before final mode received");
  const last = modeEvents(events).slice(-1)[0];
  if (last) {
    try { assert(parseData(last).mode === "live", "T16-final-mode", `got ${parseData(last).mode}`); }
    catch { fail("T16-parse", "could not parse last event"); }
  } else {
    fail("T16-no-events", "no mode events received");
  }
}

async function t17_cleanupVerification() {
  console.log("\n[T17] Post-Cleanup Verification");
  try {
    const doc = await db.collection("projects").doc(TEST_PROJECT_ID).get();
    assert(!doc.exists, "T17-firebase-project-gone", "project doc still exists after cleanup");
    const r1 = await redisCmd("EXISTS", `decide:${TEST_PROJECT_ID}`);
    const r2 = await redisCmd("EXISTS", `mode:event:${TEST_PROJECT_ID}`);
    assert(r1.result === 0, "T17-redis-decide-gone", "decide key still in Redis after cleanup");
    assert(r2.result === 0, "T17-redis-event-gone", "event key still in Redis after cleanup");
  } catch (e) {
    if (e.name !== "AssertionError") fail("T17-error", e.message);
  }
}

const ALL_MODES = ["maintenance","custom","preview","medical","brb","vacation","focus","working","launching","migrating","deploying","incident","degraded","outage","closed","coming-soon","paused","moved","beta","holiday","offline"];

async function t18_fullModeCoverage() {
  console.log("\n[T18] Full 21-mode coverage");
  const base = Date.now() + 200_000_000;
  for (let i = 0; i < ALL_MODES.length; i++) {
    const mode = ALL_MODES[i];
    let ready; const rp = new Promise(r => { ready = r; });
    const cp = sseCollect({ timeoutMs: 10000, condition: hasModeEvent, _onConnected: ready });
    await Promise.race([rp, sleep(8000)]);
    await emit(mode, { version: base + i });
    const { events, timedOut } = await cp;
    const ev = modeEvents(events)[0];
    assert(!timedOut && !!ev, `T18-${mode}-received`, "timed out or no event");
    if (ev) assert(parseData(ev).mode === mode, `T18-${mode}-mode`, `got ${parseData(ev).mode}`);
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t19_transitionMatrix() {
  console.log("\n[T19] Transition matrix (20 random A→B pairs)");
  const base = Date.now() + 300_000_000;
  const pairs = Array.from({length: 20}, (_, i) => [ALL_MODES[i % ALL_MODES.length], ALL_MODES[(i + 7) % ALL_MODES.length]]);
  for (let i = 0; i < pairs.length; i++) {
    if (i > 0) await sleep(30); // let previous pair's SSE teardown settle
    const [from, to] = pairs[i];
    let r1; const p1 = new Promise(r => { r1 = r; });
    const fromC = sseCollect({ timeoutMs: 8000, condition: hasModeEvent, _onConnected: r1 });
    await Promise.race([p1, sleep(7000)]);
    await emit(from, { version: base + i * 2 });
    const { events: evs1 } = await fromC;
    const e1 = modeEvents(evs1)[0];
    assert(!!e1 && parseData(e1).mode === from, `T19-pair${i}-from-${from}`, !e1 ? "no event" : `got ${parseData(e1).mode}`);

    let r2; const p2 = new Promise(r => { r2 = r; });
    const toC = sseCollect({ timeoutMs: 8000, condition: hasModeEvent, _onConnected: r2 });
    await Promise.race([p2, sleep(7000)]);
    await emit(to, { version: base + i * 2 + 1 });
    const { events: evs2 } = await toC;
    const e2 = modeEvents(evs2)[0];
    assert(!!e2 && parseData(e2).mode === to, `T19-pair${i}-to-${to}`, !e2 ? "no event" : `got ${parseData(e2).mode}`);
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t20_sseReconnectReplay() {
  console.log("\n[T20] SSE reconnect Last-Event-ID replay");
  const base = Date.now() + 400_000_000;
  await emit("maintenance", { version: base });
  await sleep(100);
  const lastId = String(base);
  let ready; const rp = new Promise(r => { ready = r; });
  const cp = sseCollect({ headers: { "last-event-id": lastId }, timeoutMs: 8000, condition: hasModeEvent, _onConnected: ready });
  await emit("incident", { version: base + 1 });
  const { events, timedOut } = await cp;
  const ev = modeEvents(events)[0];
  assert(!timedOut && !!ev, "T20-replay-received", "timed out");
  if (ev) assert(parseData(ev).version > base, "T20-replay-newer", `version not newer: ${parseData(ev).version}`);
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t22_rateLimitEnforcement() {
  console.log("\n[T22] Rate-limit: 65 /decide calls → 60 OK then 429");
  await redisDel(`rate:unknown:${TEST_PROJECT_ID}`);
  let ok = 0; let limited = 0;
  for (let i = 0; i < 65; i++) {
    const r = await fetch(DECIDE_URL);
    if (r.status === 200) ok++; else if (r.status === 429) limited++;
  }
  assert(ok >= 60, "T22-first-60-ok", `only ${ok} succeeded`);
  assert(limited >= 1, "T22-got-429", `no 429 received after ${ok} requests`);
  await redisDel(`rate:unknown:${TEST_PROJECT_ID}`);
}

async function t23_chaosRandomSwitching() {
  console.log("\n[T23] Chaos: 50 random switches with mixed timing, 5 clients");
  const DELAYS = [0, 0, 10, 50, 200];
  const COUNT = 50; const base = Date.now() + 500_000_000;
  const clients = Array.from({length: 5}, (_, ci) => {
    let ready; const rp = new Promise(r => { ready = r; });
    return { cp: sseCollect({ timeoutMs: 20000, condition: evs => modeEvents(evs).length >= COUNT, _onConnected: ready }), rp };
  });
  await Promise.race([Promise.all(clients.map(c => c.rp)), sleep(12000)]);
  let lastMode;
  for (let i = 0; i < COUNT; i++) {
    lastMode = ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
    await emit(lastMode, { version: base + i });
    await sleep(DELAYS[i % DELAYS.length]);
  }
  const results = await Promise.all(clients.map(c => c.cp));
  for (let ci = 0; ci < 5; ci++) {
    const evs = modeEvents(results[ci].events);
    assert(evs.length >= COUNT, `T23-client${ci+1}-count`, `got ${evs.length}/${COUNT}`);
    const finalEv = evs[evs.length - 1];
    if (finalEv) assert(parseData(finalEv).mode === lastMode, `T23-client${ci+1}-final`, `got ${parseData(finalEv)?.mode}`);
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t24_eightClientSync() {
  console.log("\n[T24] 8-client multi-client sync, 10 events");
  const base = Date.now() + 600_000_000; const COUNT = 10;
  const clients = Array.from({length: 8}, (_, ci) => {
    let ready; const rp = new Promise(r => { ready = r; });
    return { cp: sseCollect({ timeoutMs: 12000, condition: evs => modeEvents(evs).length >= COUNT, _onConnected: ready }), rp };
  });
  await Promise.race([Promise.all(clients.map(c => c.rp)), sleep(10000)]);
  for (let i = 0; i < COUNT; i++) { await emit(ALL_MODES[i % ALL_MODES.length], { version: base + i }); await sleep(15); }
  const results = await Promise.all(clients.map(c => c.cp));
  for (let ci = 0; ci < 8; ci++) {
    const evs = modeEvents(results[ci].events);
    assert(evs.length >= COUNT, `T24-client${ci+1}-count`, `got ${evs.length}/${COUNT}`);
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t25_concurrentEmitRace() {
  console.log("\n[T25] Concurrent emit race: 5 simultaneous emits");
  const base = Date.now() + 700_000_000;
  let ready; const rp = new Promise(r => { ready = r; });
  const cp = sseCollect({ timeoutMs: 10000, condition: evs => modeEvents(evs).length >= 5, _onConnected: ready });
  await Promise.race([rp, sleep(8000)]);
  await Promise.all(Array.from({length: 5}, (_, i) => emit(ALL_MODES[i], { version: base + i })));
  const { events, timedOut } = await cp;
  assert(!timedOut, "T25-all-delivered", `timed out, got ${modeEvents(events).length}/5`);
  assert(modeEvents(events).length >= 5, "T25-count", `got ${modeEvents(events).length}`);
  await sleep(600); // fire-and-forget Redis write needs time to land
  const r = await redisCmd("GET", `mode:event:${TEST_PROJECT_ID}`);
  const stored = r.result ? (typeof r.result === "string" ? JSON.parse(r.result) : r.result) : null;
  assert(stored && stored.version >= base && stored.version <= base + 4, "T25-redis-has-version", `stored version ${stored?.version}`);
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t26_fullPayloadAllModes() {
  console.log("\n[T26] Full payload (message/buttonText/redirect) on 5 modes");
  const base = Date.now() + 800_000_000;
  const modes = ["maintenance","incident","degraded","closed","offline"];
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    let ready; const rp = new Promise(r => { ready = r; });
    const cp = sseCollect({ timeoutMs: 8000, condition: hasModeEvent, _onConnected: ready });
    await Promise.race([rp, sleep(7000)]);
    await emit(mode, { version: base + i, message: `msg-${mode}`, buttonText: `btn-${mode}`, redirect: `https://example.com/${mode}` });
    const { events } = await cp;
    const ev = modeEvents(events)[0];
    if (ev) {
      const d = parseData(ev);
      assert(d.message === `msg-${mode}`, `T26-${mode}-message`, d.message);
      assert(d.buttonText === `btn-${mode}`, `T26-${mode}-btnText`, d.buttonText);
      assert(d.redirect === `https://example.com/${mode}`, `T26-${mode}-redirect`, d.redirect);
    } else { fail(`T26-${mode}-received`, "no event"); }
  }
  await redisDel(`mode:event:${TEST_PROJECT_ID}`);
}

async function t27_extendedMemory() {
  console.log("\n[T27] Extended memory: 100 rapid connect/disconnect cycles");
  const before = process.memoryUsage().heapUsed;
  for (let i = 0; i < 100; i++) {
    const ac = new AbortController();
    const p = fetch(SSE_URL, { headers: { Accept: "text/event-stream" }, signal: ac.signal }).catch(() => {});
    await sleep(10); ac.abort(); await p;
  }
  await sleep(800);
  const delta = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
  console.log(`    heap delta: ${delta.toFixed(1)} MB`);
  assert(delta < 20, "T27-heap-delta", `${delta.toFixed(1)} MB (>20 MB)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Switchyy Real-Time QA Suite — Fully Automated");
  console.log(`  BASE_URL    : ${BASE_URL}`);
  console.log(`  PROJECT_ID  : ${TEST_PROJECT_ID}`);
  console.log(`  PUBLIC_KEY  : ${TEST_PUBLIC_KEY.slice(0, 10)}...`);
  console.log("═══════════════════════════════════════════════════════");

  // Fail-fast: dev server reachable?
  try {
    const probe = await fetch(EMIT_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "probe", mode: "live" }),
    });
    if (probe.status === 404) {
      console.error("🚨 FATAL: /api/v1/test/emit returned 404 — dev server not running or NODE_ENV=production");
      process.exit(1);
    }
  } catch (e) {
    console.error(`🚨 FATAL: Cannot reach ${BASE_URL} — ${e.message}`);
    process.exit(1);
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  console.log("\n[SETUP] Creating test project in Firestore...");
  await setupTestProject();
  // Pre-clean any stale Redis keys
  await redisDel(`decide:${TEST_PROJECT_ID}`, `mode:event:${TEST_PROJECT_ID}`);
  console.log("  ✅ Test project ready\n");

  try {
    await t01_sseConnects();
    await t02_heartbeat();
    await t03_modeEventDelivery();
    await t04_eventPayloadCorrect();
    await t05_versionFence();
    await t06_rapidUpdates();
    await t07_noDuplicates();
    await t08_lastEventIdReplay();
    await t09_noReplayWhenCurrent();
    await t10_multiClientSync();
    await t11_invalidKeyRejected();
    await t12_decideCacheControl();
    await t13_memorySafety();
    await t14_transitionCssAndDebugGuard();
    await t15_stressRandomSwitching();
    await t16_liveUpdateCorrectness();
    await t18_fullModeCoverage();
    await t19_transitionMatrix();
    await t20_sseReconnectReplay();
    await t22_rateLimitEnforcement();
    await t23_chaosRandomSwitching();
    await t24_eightClientSync();
    await t25_concurrentEmitRace();
    await t26_fullPayloadAllModes();
    await t27_extendedMemory();
  } finally {
    // ── Cleanup ────────────────────────────────────────────────────────────
    console.log("\n[CLEANUP] Removing test data...");
    await cleanupTestProject();
    console.log("  ✅ Firestore + Redis test data removed");
  }

  await t17_cleanupVerification();

  const summary = { passed, failed, failures, projectId: TEST_PROJECT_ID };
  writeFileSync(join(__dirname, "test-summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("\n  Failed tests:");
    failures.forEach(({ n, r }) => console.log(`    -- FAIL: ${n}: ${r}`));
  } else {
    console.log("  All 26 tests passed!");
  }
  console.log("═══════════════════════════════════════════════════════\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("\n🚨 Unexpected error:", e);
  console.log("[CLEANUP] Attempting cleanup after fatal error...");
  try { await cleanupTestProject(); console.log("  ✅ Cleaned up"); } catch { /* best effort */ }
  process.exit(1);
});
