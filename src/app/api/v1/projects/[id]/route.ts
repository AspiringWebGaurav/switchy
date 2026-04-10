import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/services/project.service";
import { getModePolicy, nextVersion } from "@/lib/services/policy.service";
import { getUserById } from "@/lib/services/user.service";
import { updateProjectSchema } from "@/lib/validators/project";
import { success, error } from "@/lib/utils/response";
import { getEventBus } from "@/lib/events/bus";
import { redisSet, redisDel } from "@/lib/redis/client";
import { EVENT_STORE_TTL } from "@/config/constants";
import type { ModeEvent, SettingsEvent, ResolvedVisibility } from "@/lib/events/bus";
import { logAuditEvent } from "@/lib/services/audit.service";
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

    return success({ ...project, policy });
  } catch (err) {
    console.error("[Project] Get failed:", err);
    return error("Failed to get project", 500);
  }
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

    const wasEnabled = project.enabled === true;
    const willBeEnabled = parsed.data.enabled === true;
    const willBeDisabled = parsed.data.enabled === false;

    await updateProject(id, parsed.data);
    const updated = await getProjectById(id);

    // Emit SSE event when project state changes
    if (wasEnabled !== willBeEnabled || (wasEnabled && willBeDisabled)) {
      const version = nextVersion();

      if (willBeEnabled) {
        // Activated: emit current mode + resolved visibility
        const policy = await getModePolicy(id);
        const mode = policy?.value || "live";
        const visibility = updated ? await resolveVisibility(updated) : undefined;
        const event: ModeEvent = {
          projectId: id,
          mode,
          message: policy?.config?.message ?? null,
          buttonText: policy?.config?.buttonText ?? null,
          redirect: policy?.config?.redirectUrl ?? null,
          version,
          timestamp: version,
          visibility,
        };
        getEventBus().emit(`mode:${id}`, event);
        redisDel(`decide:${id}`).catch(() => {});
        redisSet(`mode:event:${id}`, event, EVENT_STORE_TTL).catch((e) =>
          console.warn(`[Project] Redis SET failed for mode:event:${id}:`, e)
        );

        logAuditEvent({
          projectId: id,
          action: "project_enable",
          userId: user.uid,
          userEmail: user.email || "",
        });
      } else if (willBeDisabled) {
        // Disconnected: emit "live" to remove overlay + invalidate cache
        const event: ModeEvent = {
          projectId: id,
          mode: "live",
          message: null,
          buttonText: null,
          redirect: null,
          version,
          timestamp: version,
        };
        getEventBus().emit(`mode:${id}`, event);
        redisDel(`decide:${id}`).catch(() => {});
        redisSet(`mode:event:${id}`, event, EVENT_STORE_TTL).catch((e) =>
          console.warn(`[Project] Redis SET failed for mode:event:${id}:`, e)
        );

        logAuditEvent({
          projectId: id,
          action: "project_disable",
          userId: user.uid,
          userEmail: user.email || "",
        });
      }
    } else if (parsed.data.name) {
      logAuditEvent({
        projectId: id,
        action: "project_update",
        userId: user.uid,
        userEmail: user.email || "",
        metadata: { name: parsed.data.name },
      });
    }

    // Log and broadcast settings change — this is the critical real-time path.
    // Even when only settings changed (no mode change), we must notify all connected
    // overlay scripts and dashboard tabs so domain/visibility rules update instantly.
    if (parsed.data.settings) {
      logAuditEvent({
        projectId: id,
        action: "project_update",
        userId: user.uid,
        userEmail: user.email || "",
        metadata: { settings: parsed.data.settings },
      });

      if (updated) {
        const version = nextVersion();
        const visibility = await resolveVisibility(updated);
        const settingsEvent: SettingsEvent = {
          projectId: id,
          visibility,
          version,
          timestamp: version,
        };
        // Instant in-process broadcast on a dedicated settings channel
        getEventBus().emit(`settings:${id}`, settingsEvent);
        // Persist for SSE replay on reconnect
        redisSet(`settings:event:${id}`, settingsEvent, EVENT_STORE_TTL).catch((e) =>
          console.warn(`[Project] Redis SET failed for settings:event:${id}:`, e)
        );
      }
    }

    return success(updated);
  } catch (err) {
    console.error("[Projects] Update failed:", err);
    return error("Failed to update project", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) return error("Project not found", 404);
    if (project.ownerId !== user.uid) return error("Forbidden", 403);

    // Emit "live" event before deletion to remove overlay from connected clients
    const version = nextVersion();
    const event: ModeEvent = {
      projectId: id,
      mode: "live",
      message: null,
      buttonText: null,
      redirect: null,
      version,
      timestamp: version,
    };
    getEventBus().emit(`mode:${id}`, event);
    
    // Clean up Redis cache
    redisDel(`decide:${id}`).catch(() => {});
    redisDel(`mode:event:${id}`).catch(() => {});
    redisDel(`settings:event:${id}`).catch(() => {});

    await deleteProject(id);
    return success({ message: "Project deleted" });
  } catch (err) {
    console.error("[Project] Delete failed:", err);
    return error("Failed to delete project", 500);
  }
}
