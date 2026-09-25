import { adminDb } from "@/lib/firebase/admin";
import type { CustomPreset, ModeConfig } from "@/types/policy";

function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function getPresets(projectId: string): Promise<CustomPreset[]> {
  const snapshot = await adminDb
    .collection("projects")
    .doc(projectId)
    .collection("presets")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CustomPreset[];
}

export async function getPreset(
  projectId: string,
  presetId: string
): Promise<CustomPreset | null> {
  const doc = await adminDb
    .collection("projects")
    .doc(projectId)
    .collection("presets")
    .doc(presetId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as CustomPreset;
}

export async function createPreset(
  projectId: string,
  name: string,
  config: ModeConfig
): Promise<CustomPreset> {
  const id = generatePresetId();
  const now = Date.now();

  const preset: CustomPreset = {
    id,
    name,
    config,
    createdAt: now,
    updatedAt: now,
  };

  await adminDb
    .collection("projects")
    .doc(projectId)
    .collection("presets")
    .doc(id)
    .set(preset);

  return preset;
}

export async function updatePreset(
  projectId: string,
  presetId: string,
  data: { name?: string; config?: ModeConfig }
): Promise<CustomPreset | null> {
  const ref = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("presets")
    .doc(presetId);

  const doc = await ref.get();
  if (!doc.exists) return null;

  const existing = doc.data() as CustomPreset;
  const updated: CustomPreset = {
    ...existing,
    id: presetId,
    name: data.name ?? existing.name,
    config: data.config ?? existing.config,
    updatedAt: Date.now(),
  };

  await ref.set(updated);
  return updated;
}

export async function deletePreset(
  projectId: string,
  presetId: string
): Promise<boolean> {
  const ref = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("presets")
    .doc(presetId);

  const doc = await ref.get();
  if (!doc.exists) return false;

  await ref.delete();
  return true;
}
