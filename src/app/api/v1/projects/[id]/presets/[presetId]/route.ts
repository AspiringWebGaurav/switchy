import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById } from "@/lib/services/project.service";
import { getPreset, updatePreset, deletePreset } from "@/lib/services/preset.service";
import { success, error } from "@/lib/utils/response";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; presetId: string }> };

const updatePresetSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  config: z.object({
    message: z.string().nullable(),
    buttonText: z.string().nullable(),
    redirectUrl: z.string().nullable(),
  }).optional(),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id, presetId } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const preset = await getPreset(id, presetId);
    if (!preset) return error("Preset not found", 404);

    return success(preset);
  } catch (err) {
    console.error("[Preset] Get failed:", err);
    return error("Failed to get preset", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id, presetId } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const body = await request.json();
    const parsed = updatePresetSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    const preset = await updatePreset(id, presetId, parsed.data);
    if (!preset) return error("Preset not found", 404);

    return success(preset);
  } catch (err) {
    console.error("[Preset] Update failed:", err);
    return error("Failed to update preset", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id, presetId } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const deleted = await deletePreset(id, presetId);
    if (!deleted) return error("Preset not found", 404);

    return success({ message: "Preset deleted" });
  } catch (err) {
    console.error("[Preset] Delete failed:", err);
    return error("Failed to delete preset", 500);
  }
}
