import { adminDb } from "@/lib/firebase/admin";
import { redisDel } from "@/lib/redis/client";
import type { User, UserPreferences } from "@/types/user";

const usersRef = adminDb.collection("users");

export async function getUserById(uid: string): Promise<User | null> {
  try {
    const doc = await usersRef.doc(uid).get();
    if (!doc.exists) return null;
    return doc.data() as User;
  } catch {
    return null;
  }
}

export async function getUserPreferences(uid: string): Promise<UserPreferences> {
  const user = await getUserById(uid);
  return user?.preferences || {};
}

export async function updateUserPreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const userRef = usersRef.doc(uid);
  const userDoc = await userRef.get();

  // User doc should always exist (created via upsertUser on login), but we handle
  // missing docs gracefully to prevent 500 errors in edge cases (legacy users, testing, etc.)
  const currentPrefs = userDoc.exists ? ((userDoc.data() as User).preferences || {}) : {};
  const newPrefs: UserPreferences = {
    ...currentPrefs,
    ...preferences,
  };

  // Use set+merge so this works whether the user doc exists or not
  await userRef.set(
    {
      preferences: newPrefs,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  // Invalidate decision cache for all user's projects
  // (visibility settings affect all projects)
  const projectsSnapshot = await adminDb
    .collection("projects")
    .where("ownerId", "==", uid)
    .get();

  const invalidations = projectsSnapshot.docs.map((doc) =>
    redisDel(`decide:${doc.id}`)
  );
  await Promise.all(invalidations);

  return newPrefs;
}
