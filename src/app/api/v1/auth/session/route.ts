import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, upsertUser, revokeSession, verifySession } from "@/lib/services/auth.service";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/config/constants";
import { success, error } from "@/lib/utils/response";
import { logAuthEvent } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return error("Missing idToken", 400);
    }

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Upsert user in Firestore
    await upsertUser(decoded);

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);

    const response = success({ uid: decoded.uid });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    // Log auth event (fire-and-forget)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || undefined;
    logAuthEvent("login", decoded.uid, decoded.email || "", ip);

    return response;
  } catch (err) {
    console.error("[Session] Create failed:", err);
    return error("Failed to create session", 401);
  }
}

export async function DELETE() {
  try {
    // Get current user before revoking session
    const user = await verifySession();
    
    await revokeSession();
    const response = success({ message: "Logged out" });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    // Log auth event (fire-and-forget)
    if (user) {
      logAuthEvent("logout", user.uid, user.email || "");
    }

    return response;
  } catch (err) {
    console.error("[Session] Delete failed:", err);
    return error("Failed to logout", 500);
  }
}
