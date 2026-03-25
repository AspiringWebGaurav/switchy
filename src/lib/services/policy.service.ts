import { adminDb } from "@/lib/firebase/admin";
import { redisDel } from "@/lib/redis/client";
import type { ModePolicy, ModeValue, ModeConfig } from "@/types/policy";

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

  const updated: ModePolicy = {
    type: "mode",
    value,
    config: {
      message: config && "message" in config ? config.message ?? null : existingData?.config?.message ?? null,
      buttonText: config && "buttonText" in config ? config.buttonText ?? null : existingData?.config?.buttonText ?? null,
      redirectUrl: config && "redirectUrl" in config ? config.redirectUrl ?? null : existingData?.config?.redirectUrl ?? null,
    },
    updatedAt: Date.now(),
    updatedBy: uid,
  };

  await policyRef.set(updated);

  // Invalidate decision cache
  await redisDel(`decide:${projectId}`);

  return updated;
}
