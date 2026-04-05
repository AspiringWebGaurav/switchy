import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase/admin";
import { getProjectById } from "@/lib/services/project.service";
import { success, error } from "@/lib/utils/response";
import type { LayoutTemplate } from "@/types/template";
import { logAuditEvent } from "@/lib/services/audit.service";

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

  const templatesSnap = await adminDb
    .collection("projects")
    .doc(id)
    .collection("templates")
    .orderBy("createdAt", "desc")
    .get();

  const templates: LayoutTemplate[] = templatesSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<LayoutTemplate, "id">),
  }));

  return success({ templates });
}

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
    const { name, description, html, css, preview } = body;

    if (!name || !html || !css) {
      return error("Missing required fields", 400);
    }

    const now = Date.now();
    const templateData: Omit<LayoutTemplate, "id"> = {
      name,
      description: description || "",
      type: "custom",
      preview: preview || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      html,
      css,
      createdAt: now,
      updatedAt: now,
      userId: user.uid,
    };

    const docRef = await adminDb
      .collection("projects")
      .doc(id)
      .collection("templates")
      .add(templateData);

    // Log audit event
    logAuditEvent({
      projectId: id,
      action: "template_create",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: { templateId: docRef.id, templateName: name },
    });

    return success({ template: { id: docRef.id, ...templateData } }, 201);
  } catch (err) {
    console.error("[Templates POST]", err);
    return error("Failed to create template", 500);
  }
}

export async function PUT(
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
    const { id: templateId, name, description, html, css, preview } = body;

    if (!templateId || !name || !html || !css) {
      return error("Missing required fields", 400);
    }

    const templateRef = adminDb
      .collection("projects")
      .doc(id)
      .collection("templates")
      .doc(templateId);

    const templateDoc = await templateRef.get();
    if (!templateDoc.exists) {
      return error("Template not found", 404);
    }

    const updateData = {
      name,
      description: description || "",
      html,
      css,
      preview: preview || templateDoc.data()?.preview,
      updatedAt: Date.now(),
    };

    await templateRef.update(updateData);

    // Log audit event
    logAuditEvent({
      projectId: id,
      action: "template_update",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: { templateId, templateName: name },
    });

    return success({ template: { id: templateId, ...templateDoc.data(), ...updateData } });
  } catch (err) {
    console.error("[Templates PUT]", err);
    return error("Failed to update template", 500);
  }
}
