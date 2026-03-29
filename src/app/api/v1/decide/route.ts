import { NextRequest, NextResponse } from "next/server";
import { getDecision } from "@/lib/services/decision.service";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { success, error } from "@/lib/utils/response";

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const key = searchParams.get("key");

    if (!projectId || !key) {
      return withCors(error("Missing projectId or key", 400));
    }

    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimit = await checkRateLimit(ip, projectId);
    if (!rateLimit.allowed) {
      const res = withCors(error("Rate limit exceeded", 429));
      res.headers.set("X-RateLimit-Remaining", "0");
      return res;
    }

    // Get decision
    const decision = await getDecision(projectId, key);

    if (!decision) {
      return withCors(error("Invalid project or key", 401));
    }

    const res = withCors(success(decision));
    res.headers.set("Cache-Control", "no-store");
    res.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );

    return res;
  } catch (err) {
    console.error("[Decide] Failed:", err);
    return withCors(error("Internal server error", 500));
  }
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
