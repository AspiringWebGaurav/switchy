import { type NextRequest } from "next/server";
import { getEventBus } from "@/lib/events/bus";
import { redisSet } from "@/lib/redis/client";
import type { ModeEvent } from "@/lib/events/bus";
import type { ModeValue } from "@/types/policy";
import { EVENT_STORE_TTL } from "@/config/constants";

export const runtime = "nodejs";

let _lastTestVersion = 0;
function nextTestVersion(): number {
  const now = Date.now();
  _lastTestVersion = now > _lastTestVersion ? now : _lastTestVersion + 1;
  return _lastTestVersion;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  let body: {
    projectId?: string;
    mode?: ModeValue;
    message?: string | null;
    buttonText?: string | null;
    redirect?: string | null;
    version?: number;
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { projectId, mode } = body;
  if (!projectId || !mode) {
    return new Response("Missing projectId or mode", { status: 400 });
  }

  const version = typeof body.version === "number" ? body.version : nextTestVersion();

  const event: ModeEvent = {
    projectId,
    mode,
    message: body.message ?? null,
    buttonText: body.buttonText ?? null,
    redirect: body.redirect ?? null,
    version,
    timestamp: version,
  };

  getEventBus().emit(`mode:${projectId}`, event);

  // Persist for replay — non-critical path, fire-and-forget after bus emit
  redisSet(`mode:event:${projectId}`, event, EVENT_STORE_TTL).catch((e) =>
    console.warn(`[Emit] Redis SET failed:`, e)
  );

  return Response.json({ ok: true, event });
}
