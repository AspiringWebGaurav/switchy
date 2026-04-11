import { NextRequest, NextResponse } from "next/server";
import { getDecision } from "@/lib/services/decision.service";
import { switchyTemplate } from "@/lib/scripts/template";
import { glassLayout } from "@/lib/scripts/glassLayout";

export const dynamic = 'force-dynamic';

function getScriptTemplate() {
  return switchyTemplate;
}

function getGlassLayout() {
  return glassLayout;
}

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project");
    const key = searchParams.get("key");

    let decision = null;

    if (projectId && key) {
      // Get decision
      decision = await getDecision(projectId, key);
    }
    
    // Safe fallback if missing/invalid project/key or policy
    if (!decision) {
      decision = { mode: "live" };
    }

    const templateContent = getScriptTemplate();
    const layoutContent = decision.mode !== "live" ? getGlassLayout() : ""; 
    
    // Construct the payload
    // We inject __SWITCHY_PRELOAD and the standard layout to remove network overhead
    const payload = `
// Switchy.js Dynamic Preload
window.__SWITCHY_PRELOAD = ${JSON.stringify(decision)};
${layoutContent}
${templateContent}
`;

    const res = new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        // Edge functions + Redis are fast enough to warrant low TTL, enabling near-instant real-time switches
        // We use 10s CDN cache with 50s stale-while-revalidate.
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=50",
      },
    });

    return withCors(res);
  } catch (err) {
    console.error("[Switchy Script] Failed to serve dynamic script:", err);
    // Ultimate safe fallback on fail: instantly default to live mode
    try {
      const safePayload = `window.__SWITCHY_PRELOAD = {"mode":"live"};\n${getScriptTemplate()}`;
      const res = new NextResponse(safePayload, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store",
        },
      });
      return withCors(res);
    } catch (fallbackErr) {
      // If even reading the template fails, return a dummy script to not break client execution
      return withCors(new NextResponse('console.error("Switchyy delivery failed. Safe mode applied.");', {
        headers: { "Content-Type": "application/javascript" }
      }));
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
