import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById } from "@/lib/services/project.service";
import { getModePolicy, updateModePolicy } from "@/lib/services/policy.service";
import { updatePolicySchema } from "@/lib/validators/policy";
import { success, error } from "@/lib/utils/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    const policy = await getModePolicy(id);
    if (!policy) return error("Policy not found", 404);

    return success(policy);
  } catch (err) {
    console.error("[Policy] Get failed:", err);
    return error("Failed to get policy", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);
    const body = await request.json();
    const parsed = updatePolicySchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    const updated = await updateModePolicy(
      id,
      user.uid,
      parsed.data.value,
      parsed.data.config
    );

    return success(updated);
  } catch (err) {
    console.error("[Policy] Update failed:", err);
    return error("Failed to update policy", 500);
  }
}
