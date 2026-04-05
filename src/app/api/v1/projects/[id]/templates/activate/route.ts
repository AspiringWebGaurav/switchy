import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getProjectById, updateProject } from "@/lib/services/project.service";
import { getModePolicy, nextVersion } from "@/lib/services/policy.service";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { success, error } from "@/lib/utils/response";
import { logAuditEvent } from "@/lib/services/audit.service";
import { getEventBus } from "@/lib/events/bus";
import { redisDel, redisSet } from "@/lib/redis/client";
import { EVENT_STORE_TTL } from "@/config/constants";
import type { ModeEvent } from "@/lib/events/bus";
import type { LayoutTemplate } from "@/types/template";

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

    // Get template data for SSE broadcast
    const templateData = templateDoc.data() as LayoutTemplate;

    // Invalidate decision cache so next /decide call fetches fresh template
    await redisDel(`decide:${id}`);

    // Emit SSE event with updated template
    const policy = await getModePolicy(id);
    if (policy && project.enabled === true) {
      const version = nextVersion();
      const event: ModeEvent = {
        projectId: id,
        mode: policy.value,
        message: policy.config?.message ?? null,
        buttonText: policy.config?.buttonText ?? null,
        redirect: policy.config?.redirectUrl ?? null,
        version,
        timestamp: version,
      };
      
      // Emit to connected clients
      getEventBus().emit(`mode:${id}`, event);
      
      // Store for SSE replay
      redisSet(`mode:event:${id}`, event, EVENT_STORE_TTL).catch((e) =>
        console.warn(`[Template Activate] Redis SET failed:`, e)
      );
    }

    // Log audit event
    logAuditEvent({
      projectId: id,
      action: "template_activate",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: { templateId, templateName: templateData.name },
    });

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
    const previousTemplateId = project.activeTemplateId;

    // Remove activeTemplateId (revert to default glass layout)
    await adminDb.collection("projects").doc(id).update({
      activeTemplateId: FieldValue.delete(),
      updatedAt: Date.now(),
    });

    // Invalidate decision cache
    await redisDel(`decide:${id}`);

    // Emit SSE event to revert to default layout
    const policy = await getModePolicy(id);
    if (policy && project.enabled === true) {
      const version = nextVersion();
      const event: ModeEvent = {
        projectId: id,
        mode: policy.value,
        message: policy.config?.message ?? null,
        buttonText: policy.config?.buttonText ?? null,
        redirect: policy.config?.redirectUrl ?? null,
        version,
        timestamp: version,
      };
      
      // Emit to connected clients
      getEventBus().emit(`mode:${id}`, event);
      
      // Store for SSE replay
      redisSet(`mode:event:${id}`, event, EVENT_STORE_TTL).catch((e) =>
        console.warn(`[Template Deactivate] Redis SET failed:`, e)
      );
    }

    // Log audit event
    logAuditEvent({
      projectId: id,
      action: "template_deactivate",
      userId: user.uid,
      userEmail: user.email || "",
      metadata: { previousTemplateId },
    });

    return success({ message: "Template deactivated, using default layout" });
  } catch (err) {
    console.error("[Templates Deactivate]", err);
    return error("Failed to deactivate template", 500);
  }
}
