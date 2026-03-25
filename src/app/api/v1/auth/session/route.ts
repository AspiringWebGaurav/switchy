import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, upsertUser } from "@/lib/services/auth.service";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/config/constants";
import { success, error } from "@/lib/utils/response";

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

    return response;
  } catch (err) {
    console.error("[Session] Create failed:", err);
    return error("Failed to create session", 401);
  }
}

export async function DELETE() {
  try {
    const response = success({ message: "Logged out" });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[Session] Delete failed:", err);
    return error("Failed to logout", 500);
  }
}
