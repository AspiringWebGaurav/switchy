import { adminDb } from "@/lib/firebase/admin";
import { getProjectsByOwner } from "@/lib/services/project.service";
import { getEventBus } from "@/lib/events/bus";
import { nextVersion } from "@/lib/services/policy.service";
import type { AuditEvent } from "@/lib/events/bus";

export type { AuditAction } from "@/types/audit";
import type { AuditAction } from "@/types/audit";

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  metadata: Record<string, unknown>;
  ip?: string;
  timestamp: number;
}

export interface AuditLogInput {
  projectId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function generateHumanMessage(action: AuditAction, metadata: Record<string, unknown>): string {
  switch (action) {
    case "mode_change":
      return `Switched to ${formatModeName(metadata.to as string)} mode`;
    case "template_activate":
      return `Activated "${metadata.templateName || "Untitled"}" template`;
    case "template_create":
      return `Created new template "${metadata.templateName || "Untitled"}"`;
    case "template_update":
      return `Updated "${metadata.templateName || "Untitled"}" template`;
    case "template_delete":
      return `Removed "${metadata.templateName || "Untitled"}" template`;
    case "template_deactivate":
      return `Deactivated "${metadata.templateName || "Untitled"}" template`;
    case "project_enable":
      return "Project is now live";
    case "project_disable":
      return "Project paused";
    case "project_update":
      if (metadata.name) return `Renamed project to "${metadata.name}"`;
      return "Project settings updated";
    case "project_create":
      return "New project created";
    case "project_delete":
      return "Project deleted";
    case "settings_update":
      return "Settings updated";
    case "api_key_regenerate":
      return "API key regenerated for security";
    case "login":
      return "Signed in to dashboard";
    case "logout":
      return "Session ended";
    case "register":
      return "Account created";
    default:
      return (action as string).replace(/_/g, " ");
  }
}

function formatModeName(mode: string | undefined): string {
  if (!mode) return "unknown";
  return mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, " ");
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const { projectId, action, userId, userEmail, metadata = {}, ip } = input;

  const timestamp = Date.now();
  const id = `audit_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // 1. EMIT FIRST — instant real-time delivery to UI via SSE
  const auditEvent: AuditEvent = {
    id,
    projectId,
    action,
    message: generateHumanMessage(action, metadata),
    userEmail,
    timestamp,
    version: nextVersion(),
  };
  getEventBus().emit(`audit:${projectId}`, auditEvent);

  // 2. FIRESTORE AFTER — fire-and-forget for history (non-blocking)
  const logRef = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("audit_logs")
    .doc(id);

  const logData: Omit<AuditLog, 'ip'> & { ip?: string } = {
    id,
    action,
    userId,
    userEmail,
    metadata: stripUndefined(metadata),
    timestamp,
  };
  if (ip) logData.ip = ip;
  
  logRef.set(logData).catch(err => console.error("[Audit] Firestore write failed:", err));
}

export async function getAuditLogs(
  projectId: string,
  options: { limit?: number; before?: number } = {}
): Promise<{ logs: AuditLog[]; hasMore: boolean }> {
  const { limit = 50, before } = options;

  let query = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("audit_logs")
    .orderBy("timestamp", "desc")
    .limit(limit + 1);

  if (before) {
    query = query.where("timestamp", "<", before);
  }

  const snapshot = await query.get();
  const logs = snapshot.docs.map((doc) => doc.data() as AuditLog);

  const hasMore = logs.length > limit;
  if (hasMore) {
    logs.pop();
  }

  return { logs, hasMore };
}

export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    login: "Logged in",
    logout: "Logged out",
    register: "Registered",
    mode_change: "Changed mode",
    template_create: "Created template",
    template_update: "Updated template",
    template_delete: "Deleted template",
    template_activate: "Activated template",
    template_deactivate: "Deactivated template",
    project_create: "Created project",
    project_update: "Updated project",
    project_delete: "Deleted project",
    project_enable: "Enabled project",
    project_disable: "Disabled project",
    settings_update: "Updated settings",
    api_key_regenerate: "Regenerated API key",
  };
  return labels[action] || action;
}

export function getActionColor(action: AuditAction): string {
  if (action.startsWith("template_")) return "indigo";
  if (action.startsWith("project_")) return "emerald";
  if (action === "mode_change") return "amber";
  if (action === "login" || action === "register") return "sky";
  if (action === "logout") return "stone";
  return "violet";
}

export async function logAuthEvent(
  action: "login" | "logout" | "register",
  userId: string,
  userEmail: string,
  ip?: string
): Promise<void> {
  try {
    const projects = await getProjectsByOwner(userId);
    
    await Promise.all(
      projects.map((project) =>
        logAuditEvent({
          projectId: project.id,
          action,
          userId,
          userEmail,
          ip,
        })
      )
    );
  } catch (err) {
    console.error("[Audit] Failed to log auth event:", err);
  }
}
