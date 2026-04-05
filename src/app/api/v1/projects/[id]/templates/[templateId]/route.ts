import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase/admin";
import { getProjectById } from "@/lib/services/project.service";
import { success, error } from "@/lib/utils/response";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const { id, templateId } = await params;

  const project = await getProjectById(id);
  if (!project || project.ownerId !== user.uid) {
    return error("Project not found", 404);
  }

  try {
    const templateRef = adminDb
      .collection("projects")
      .doc(id)
      .collection("templates")
      .doc(templateId);

    const templateDoc = await templateRef.get();
    if (!templateDoc.exists) {
      return error("Template not found", 404);
    }

    const templateData = templateDoc.data();
    await templateRef.delete();

    // Log audit event
    logAuditEvent({
      projectId: id,
      action: "template_delete",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: { templateId, templateName: templateData?.name },
    });

    return success({ deleted: true });
  } catch (err) {
    console.error("[Templates DELETE]", err);
    return error("Failed to delete template", 500);
  }
}
