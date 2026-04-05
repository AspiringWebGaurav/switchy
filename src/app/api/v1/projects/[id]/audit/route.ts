import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById } from "@/lib/services/project.service";
import { getAuditLogs } from "@/lib/services/audit.service";
import { success, error } from "@/lib/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const { id } = await params;

  const project = await getProjectById(id);
  if (!project || project.ownerId !== user.uid) {
    return error("Project not found", 404);
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before")
      ? parseInt(searchParams.get("before")!, 10)
      : undefined;

    const { logs, hasMore } = await getAuditLogs(id, { limit, before });

    return success({ logs, hasMore });
  } catch (err) {
    console.error("[Audit] Get logs failed:", err);
    return error("Failed to get audit logs", 500);
  }
}
