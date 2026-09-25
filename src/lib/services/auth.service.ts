import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/config/constants";
import { cookies } from "next/headers";
import type { User } from "@/types/user";

export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = SESSION_MAX_AGE * 1000; // milliseconds
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn,
  });
  return sessionCookie;
}

export async function verifySession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) return null;

    return userDoc.data() as User;
  } catch {
    return null;
  }
}

export async function revokeSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    await adminAuth.revokeRefreshTokens(decoded.uid);
  } catch {
    // Best-effort — cookie already invalid or user doesn't exist; proceed
  }
}

export async function upsertUser(decoded: {
  uid: string;
  name?: string;
  email?: string;
  picture?: string;
}): Promise<void> {
  const userRef = adminDb.collection("users").doc(decoded.uid);
  const now = Date.now();

  await userRef.set(
    {
      uid: decoded.uid,
      name: decoded.name || "",
      email: decoded.email || "",
      avatar: decoded.picture || "",
      updatedAt: now,
    },
    { merge: true }
  );

  const userDoc = await userRef.get();
  if (!userDoc.data()?.createdAt) {
    await userRef.update({ createdAt: now });
  }
}
