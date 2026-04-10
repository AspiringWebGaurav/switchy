import { getProjectByPublicKey, updateProject } from "@/lib/services/project.service";
import { getModePolicy } from "@/lib/services/policy.service";
import { getUserById } from "@/lib/services/user.service";
import { redisGet, redisSet } from "@/lib/redis/client";
import { adminDb } from "@/lib/firebase/admin";
import { CACHE_TTL } from "@/config/constants";
import type { DecisionResponse, VisibilityConfig } from "@/types/api";
import type { LayoutTemplate } from "@/types/template";

export async function getDecision(
  projectId: string,
  publicKey: string
): Promise<DecisionResponse | null> {
  // Try cache first
  const cacheKey = `decide:${projectId}`;
  const cached = await redisGet<DecisionResponse>(cacheKey);
  if (cached) return cached;

  // Validate project + key
  const project = await getProjectByPublicKey(projectId, publicKey);
  if (!project) return null;

  // Block if manually disconnected
  if (project.enabled === false) return null;

  // Not yet activated — write detected:true on first ever call, then return pending response
  if (project.enabled === undefined) {
    if (!project.detected) {
      await updateProject(projectId, { detected: true });
    }
    // Still include visibility even for pending projects
    const owner = await getUserById(project.ownerId);
    const pending: DecisionResponse = {
      mode: "live",
      message: null,
      buttonText: null,
      redirect: null,
      timestamp: Date.now(),
      pending: true,
      visibility: {
        devOverlayEnabled: owner?.preferences?.devOverlayEnabled,
        devBlocklist: owner?.preferences?.devBlocklist ?? [],
        domainAllowlist: owner?.preferences?.domainAllowlist ?? [],
        domainBlocklist: owner?.preferences?.domainBlocklist ?? [],
      },
    };
    await redisSet(cacheKey, pending, CACHE_TTL);
    return pending;
  }

  // Get mode policy
  const policy = await getModePolicy(projectId);
  if (!policy) return null;

  // Resolve visibility: project > user > default
  const needUserFallback = 
    (project.settings?.devOverlayEnabled === undefined || project.settings.devOverlayEnabled === null) ||
    (project.settings?.devBlocklist === undefined || project.settings.devBlocklist === null) ||
    (project.settings?.domainAllowlist === undefined || project.settings.domainAllowlist === null);
  
  const owner = needUserFallback ? await getUserById(project.ownerId) : null;

  const visibility: VisibilityConfig = {
    devOverlayEnabled: 
      (project.settings?.devOverlayEnabled !== undefined && project.settings.devOverlayEnabled !== null)
        ? project.settings.devOverlayEnabled
        : owner?.preferences?.devOverlayEnabled,
    devBlocklist:
      (project.settings?.devBlocklist !== undefined && project.settings.devBlocklist !== null)
        ? project.settings.devBlocklist
        : (owner?.preferences?.devBlocklist ?? []),
    domainAllowlist: 
      (project.settings?.domainAllowlist !== undefined && project.settings.domainAllowlist !== null)
        ? project.settings.domainAllowlist
        : (owner?.preferences?.domainAllowlist ?? []),
    domainBlocklist:
      (project.settings?.domainBlocklist !== undefined && project.settings.domainBlocklist !== null)
        ? project.settings.domainBlocklist
        : (owner?.preferences?.domainBlocklist ?? []),
  };

  const response: DecisionResponse = {
    mode: policy.value,
    message: policy.config.message,
    buttonText: policy.config.buttonText,
    redirect: policy.config.redirectUrl,
    timestamp: Date.now(),
    visibility,
  };

  // If project has active custom template, fetch and include it
  if (project.activeTemplateId) {
    try {
      const templateDoc = await adminDb
        .collection("projects")
        .doc(projectId)
        .collection("templates")
        .doc(project.activeTemplateId)
        .get();

      if (templateDoc.exists) {
        const templateData = templateDoc.data() as LayoutTemplate;
        response.template = {
          html: templateData.html,
          css: templateData.css,
        };
      }
    } catch (err) {
      console.error("[Decision] Failed to fetch template:", err);
      // Continue without template - will use default layout
    }
  }

  // Cache the response
  await redisSet(cacheKey, response, CACHE_TTL);

  return response;
}
