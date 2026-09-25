import { redisIncr } from "@/lib/redis/client";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from "@/config/constants";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  ip: string,
  projectId: string
): Promise<RateLimitResult> {
  const key = `rate:${ip}:${projectId}`;
  const count = await redisIncr(key, RATE_LIMIT_WINDOW);

  // If Redis is down, fail open
  if (count === null) {
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }

  return {
    allowed: count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - count),
  };
}
