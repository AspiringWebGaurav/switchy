import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById } from "@/lib/services/project.service";
import { getPresets, createPreset } from "@/lib/services/preset.service";
import { success, error } from "@/lib/utils/response";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const createPresetSchema = z.object({
  name: z.string().min(1).max(50),
  config: z.object({
    message: z.string().nullable(),
    buttonText: z.string().nullable(),
    redirectUrl: z.string().nullable(),
  }),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const presets = await getPresets(id);
    return success(presets);
  } catch (err) {
    console.error("[Presets] Get failed:", err);
    return error("Failed to get presets", 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const body = await request.json();
    const parsed = createPresetSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    const preset = await createPreset(id, parsed.data.name, parsed.data.config);
    return success(preset, 201);
  } catch (err) {
    console.error("[Presets] Create failed:", err);
    return error("Failed to create preset", 500);
  }
}
