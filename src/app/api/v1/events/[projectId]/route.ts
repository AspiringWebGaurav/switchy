import { type NextRequest } from "next/server";
import { getProjectByPublicKey } from "@/lib/services/project.service";
import { redisGet } from "@/lib/redis/client";
import { getEventBus } from "@/lib/events/bus";
import type { ModeEvent } from "@/lib/events/bus";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Last-Event-ID",
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400, headers: CORS_HEADERS });
  }

  const project = await getProjectByPublicKey(projectId, key);
  if (!project) {
    return new Response("Invalid project or key", {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  const channel = `mode:${projectId}`;
  const bus = getEventBus();
  const encoder = new TextEncoder();

  // cleanupRef is set inside start() so cancel() can share the same cleanup logic
  let cleanupRef: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let closed = false;

      function cleanup() {
        if (closed) return;
        closed = true;
        bus.off(channel, handler);
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      }

      // Expose cleanup to cancel() via the outer ref
      cleanupRef = cleanup;

      function write(chunk: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }

      function handler(event: ModeEvent) {
        write(
          `event: mode\n` +
            `id: ${event.version}\n` +
            `data: ${JSON.stringify(event)}\n\n`
        );
      }

      // Clean up when client disconnects
      request.signal.addEventListener(
        "abort",
        () => {
          cleanup();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        },
        { once: true }
      );

      // Catch-up replay on reconnect via Last-Event-ID
      const lastEventIdHeader = request.headers.get("last-event-id");
      if (lastEventIdHeader) {
        const lastId = parseInt(lastEventIdHeader, 10);
        if (!isNaN(lastId) && lastId > 0) {
          redisGet<ModeEvent>(`mode:event:${projectId}`)
            .then((cached) => {
              if (cached && cached.version > lastId) {
                handler(cached);
              }
            })
            .catch(() => {
              /* Redis unavailable — skip catch-up, next live event will correct */
            });
        }
      }

      // Subscribe to live event bus — zero polling
      bus.on(channel, handler);

      // Heartbeat every 25 s — keeps proxy/CDN from closing idle connections
      heartbeatTimer = setInterval(() => write(":\n\n"), 25000);
    },
    cancel() {
      cleanupRef();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
