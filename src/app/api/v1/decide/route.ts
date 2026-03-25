import { NextRequest } from "next/server";
import { getDecision } from "@/lib/services/decision.service";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { success, error } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const key = searchParams.get("key");

  if (!projectId || !key) {
    return error("Missing projectId or key", 400);
  }

  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = await checkRateLimit(ip, projectId);
  if (!rateLimit.allowed) {
    const res = error("Rate limit exceeded", 429);
    res.headers.set("X-RateLimit-Remaining", "0");
    return res;
  }

  // Get decision
  const decision = await getDecision(projectId, key);

  if (!decision) {
    return error("Invalid project or key", 401);
  }

  const res = success(decision);
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60"
  );
  res.headers.set(
    "X-RateLimit-Remaining",
    rateLimit.remaining.toString()
  );
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return res;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
