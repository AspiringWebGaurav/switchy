import { adminDb } from "@/lib/firebase/admin";
import { getProjectsByOwner } from "@/lib/services/project.service";

export type AuditAction =
  | "login"
  | "logout"
  | "register"
  | "mode_change"
  | "template_create"
  | "template_update"
  | "template_delete"
  | "template_activate"
  | "template_deactivate"
  | "project_create"
  | "project_update"
  | "project_delete"
  | "project_enable"
  | "project_disable"
  | "settings_update"
  | "api_key_regenerate";

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

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const { projectId, action, userId, userEmail, metadata = {}, ip } = input;

  try {
    const logRef = adminDb
      .collection("projects")
      .doc(projectId)
      .collection("audit_logs")
      .doc();

    const log: AuditLog = {
      id: logRef.id,
      action,
      userId,
      userEmail,
      metadata,
      ip,
      timestamp: Date.now(),
    };

    await logRef.set(log);
  } catch (err) {
    console.error("[Audit] Failed to log event:", err);
  }
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
