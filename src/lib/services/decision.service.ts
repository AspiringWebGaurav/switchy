import { getProjectByPublicKey, updateProject } from "@/lib/services/project.service";
import { getModePolicy } from "@/lib/services/policy.service";
import { redisGet, redisSet } from "@/lib/redis/client";
import { CACHE_TTL } from "@/config/constants";
import type { DecisionResponse } from "@/types/api";

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
    const pending: DecisionResponse = {
      mode: "live",
      message: null,
      buttonText: null,
      redirect: null,
      timestamp: Date.now(),
      pending: true,
    };
    await redisSet(cacheKey, pending, CACHE_TTL);
    return pending;
  }

  // Get mode policy
  const policy = await getModePolicy(projectId);
  if (!policy) return null;

  const response: DecisionResponse = {
    mode: policy.value,
    message: policy.config.message,
    buttonText: policy.config.buttonText,
    redirect: policy.config.redirectUrl,
    timestamp: Date.now(),
  };

  // Cache the response
  await redisSet(cacheKey, response, CACHE_TTL);

  return response;
}
