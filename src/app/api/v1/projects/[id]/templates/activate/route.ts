import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById, updateProject } from "@/lib/services/project.service";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { success, error } from "@/lib/utils/response";

// POST: Activate a template
export async function POST(
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
    const body = await req.json();
    const { templateId } = body;

    if (!templateId) {
      return error("Missing templateId", 400);
    }

    // Verify template exists and belongs to this project
    const templateDoc = await adminDb
      .collection("projects")
      .doc(id)
      .collection("templates")
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      return error("Template not found", 404);
    }

    // Activate the template
    await updateProject(id, { activeTemplateId: templateId });

    return success({ 
      message: "Template activated",
      activeTemplateId: templateId 
    });
  } catch (err) {
    console.error("[Templates Activate]", err);
    return error("Failed to activate template", 500);
  }
}

// DELETE: Deactivate template (revert to default)
export async function DELETE(
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
    // Remove activeTemplateId (revert to default glass layout)
    await adminDb.collection("projects").doc(id).update({
      activeTemplateId: FieldValue.delete(),
      updatedAt: Date.now(),
    });

    return success({ message: "Template deactivated, using default layout" });
  } catch (err) {
    console.error("[Templates Deactivate]", err);
    return error("Failed to deactivate template", 500);
  }
}
