import { adminDb } from "@/lib/firebase/admin";
import { redisDel, redisSet } from "@/lib/redis/client";
import { getEventBus } from "@/lib/events/bus";
import type { ModeEvent } from "@/lib/events/bus";
import type { ModePolicy, ModeValue, ModeConfig } from "@/types/policy";
import { EVENT_STORE_TTL } from "@/config/constants";

let _lastVersion = 0;
export function nextVersion(): number {
  const now = Date.now();
  _lastVersion = now > _lastVersion ? now : _lastVersion + 1;
  return _lastVersion;
}

export async function getModePolicy(
  projectId: string
): Promise<ModePolicy | null> {
  const doc = await adminDb
    .collection("projects")
    .doc(projectId)
    .collection("policies")
    .doc("mode")
    .get();

  if (!doc.exists) return null;
  return doc.data() as ModePolicy;
}

export async function updateModePolicy(
  projectId: string,
  uid: string,
  value: ModeValue,
  config?: Partial<ModeConfig>
): Promise<ModePolicy> {
  const policyRef = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("policies")
    .doc("mode");

  const existing = await policyRef.get();
  const existingData = existing.data() as ModePolicy | undefined;

  // Determine the config to use
  let activeConfig: ModeConfig;
  let customConfig = existingData?.customConfig;

  if (value === "custom") {
    // Switching TO custom mode
    if (config) {
      // Explicit config provided - use it and save as customConfig
      activeConfig = {
        message: config.message ?? null,
        buttonText: config.buttonText ?? null,
        redirectUrl: config.redirectUrl ?? null,
      };
      customConfig = activeConfig;
    } else if (existingData?.customConfig) {
      // No config provided - restore saved customConfig
      activeConfig = existingData.customConfig;
    } else if (existingData?.value === "custom" && existingData.config) {
      // Already on custom, keep current config
      activeConfig = existingData.config;
      customConfig = existingData.config;
    } else {
      // No saved custom config - use defaults
      activeConfig = { message: null, buttonText: null, redirectUrl: null };
    }
  } else {
    // Switching to non-custom mode - clear config (use defaults)
    activeConfig = { message: null, buttonText: null, redirectUrl: null };
    // Preserve customConfig for later restoration
    if (existingData?.value === "custom" && existingData.config) {
      customConfig = existingData.config;
    }
  }

  const updated: ModePolicy = {
    type: "mode",
    value,
    config: activeConfig,
    customConfig: customConfig ?? null, // Firestore doesn't accept undefined
    updatedAt: Date.now(),
    updatedBy: uid,
  };

  await policyRef.set(updated);

  // Invalidate decision cache
  const delOk = await redisDel(`decide:${projectId}`);
  if (!delOk) {
    console.warn(`[Policy] Redis DEL failed for decide:${projectId}`);
  }

  // Build structured event
  const version = nextVersion();
  const event: ModeEvent = {
    projectId,
    mode: value,
    message: updated.config.message,
    buttonText: updated.config.buttonText,
    redirect: updated.config.redirectUrl,
    version,
    timestamp: version,
  };

  // Instant in-process broadcast — critical real-time path, must not wait for Redis
  getEventBus().emit(`mode:${projectId}`, event);

  // Persist for SSE replay — non-critical, fire-and-forget after bus emit
  redisSet(`mode:event:${projectId}`, event, EVENT_STORE_TTL).catch((e) =>
    console.warn(`[Policy] Redis SET failed for mode:event:${projectId}:`, e)
  );

  return updated;
}
