import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error("[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error("[Redis] GET failed:", error);
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  try {
    const client = getRedis();
    if (!client) return false;
    await client.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error("[Redis] SET failed:", error);
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  try {
    const client = getRedis();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (error) {
    console.error("[Redis] DEL failed:", error);
    return false;
  }
}

export async function redisIncr(
  key: string,
  ttlSeconds: number
): Promise<number | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    console.error("[Redis] INCR failed:", error);
    return null;
  }
}
