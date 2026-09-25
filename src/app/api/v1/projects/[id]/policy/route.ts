import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById } from "@/lib/services/project.service";
import { getUserById } from "@/lib/services/user.service";
import { getModePolicy, updateModePolicy } from "@/lib/services/policy.service";
import { updatePolicySchema } from "@/lib/validators/policy";
import { success, error } from "@/lib/utils/response";
import { logAuditEvent } from "@/lib/services/audit.service";
import type { ResolvedVisibility } from "@/lib/events/bus";
import type { Project } from "@/types/project";

type RouteContext = { params: Promise<{ id: string }> };

/** Resolve the effective visibility for a project (project settings → user prefs → defaults). */
async function resolveVisibility(project: Project): Promise<ResolvedVisibility> {
  const s = project.settings;
  const needsUserFallback =
    s?.devOverlayEnabled === undefined || s?.devOverlayEnabled === null ||
    s?.devBlocklist === undefined || s?.devBlocklist === null ||
    s?.domainAllowlist === undefined || s?.domainAllowlist === null ||
    s?.domainBlocklist === undefined || s?.domainBlocklist === null;

  const owner = needsUserFallback ? await getUserById(project.ownerId) : null;

  return {
    devOverlayEnabled:
      s?.devOverlayEnabled !== undefined && s?.devOverlayEnabled !== null
        ? s.devOverlayEnabled
        : owner?.preferences?.devOverlayEnabled,
    devBlocklist:
      s?.devBlocklist !== undefined && s?.devBlocklist !== null
        ? s.devBlocklist
        : (owner?.preferences?.devBlocklist ?? []),
    domainAllowlist:
      s?.domainAllowlist !== undefined && s?.domainAllowlist !== null
        ? s.domainAllowlist
        : (owner?.preferences?.domainAllowlist ?? []),
    domainBlocklist:
      s?.domainBlocklist !== undefined && s?.domainBlocklist !== null
        ? s.domainBlocklist
        : (owner?.preferences?.domainBlocklist ?? []),
  };
}

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

    // Get current policy for audit log
    const currentPolicy = await getModePolicy(id);
    const previousMode = currentPolicy?.value;

    // Resolve visibility once so the emitted ModeEvent is self-contained
    const visibility = await resolveVisibility(project);

    const updated = await updateModePolicy(
      id,
      user.uid,
      parsed.data.value,
      parsed.data.config,
      visibility
    );

    // Log audit event (fire-and-forget)
    logAuditEvent({
      projectId: id,
      action: "mode_change",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: {
        from: previousMode,
        to: parsed.data.value,
        config: parsed.data.config,
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[Policy] Update failed:", err);
    return error("Failed to update policy", 500);
  }
}
