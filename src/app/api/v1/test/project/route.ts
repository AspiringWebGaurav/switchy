import { type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { redisDel } from "@/lib/redis/client";
import { generatePublicKey } from "@/lib/utils/keys";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  let body: { projectId?: string } = {};
  try { body = await request.json(); } catch { /* use defaults */ }

  const projectId = body.projectId || `switchy_pw_${Date.now()}`;
  const publicKey = generatePublicKey();
  const now = Date.now();

  await adminDb.collection("projects").doc(projectId).set({
    id: projectId, ownerId: "playwright_qa", name: "Playwright QA Project",
    publicKey, detected: true, enabled: true, createdAt: now, updatedAt: now,
  });
  await adminDb.collection("projects").doc(projectId)
    .collection("policies").doc("mode").set({
      type: "mode", value: "live",
      config: { message: null, buttonText: null, redirectUrl: null },
      updatedAt: now, updatedBy: "playwright",
    });

  return Response.json({ projectId, publicKey });
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  let body: { projectId?: string } = {};
  try { body = await request.json(); } catch { /* skip */ }
  const { projectId } = body;
  if (!projectId) return new Response("Missing projectId", { status: 400 });

  try {
    await adminDb.collection("projects").doc(projectId)
      .collection("policies").doc("mode").delete();
    await adminDb.collection("projects").doc(projectId).delete();
  } catch { /* best effort */ }

  await redisDel(`decide:${projectId}`);
  await redisDel(`mode:event:${projectId}`);
  await redisDel(`rate:unknown:${projectId}`);

  return Response.json({ ok: true });
}
