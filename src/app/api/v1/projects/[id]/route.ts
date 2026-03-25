import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/services/project.service";
import { getModePolicy } from "@/lib/services/policy.service";
import { updateProjectSchema } from "@/lib/validators/project";
import { success, error } from "@/lib/utils/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const { id } = await context.params;
  const project = await getProjectById(id);

  if (!project) return error("Project not found", 404);
  if (project.ownerId !== user.uid) return error("Forbidden", 403);

  const policy = await getModePolicy(id);

  return success({ ...project, policy });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const { id } = await context.params;
  const project = await getProjectById(id);

  if (!project) return error("Project not found", 404);
  if (project.ownerId !== user.uid) return error("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    await updateProject(id, parsed.data);
    const updated = await getProjectById(id);
    return success(updated);
  } catch (err) {
    console.error("[Projects] Update failed:", err);
    return error("Failed to update project", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const { id } = await context.params;
  const project = await getProjectById(id);

  if (!project) return error("Project not found", 404);
  if (project.ownerId !== user.uid) return error("Forbidden", 403);

  try {
    await deleteProject(id);
    return success({ message: "Project deleted" });
  } catch (err) {
    console.error("[Projects] Delete failed:", err);
    return error("Failed to delete project", 500);
  }
}
