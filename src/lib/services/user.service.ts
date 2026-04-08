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
  
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const currentPrefs = (userDoc.data() as User).preferences || {};
  const newPrefs: UserPreferences = {
    ...currentPrefs,
    ...preferences,
  };

  await userRef.update({
    preferences: newPrefs,
    updatedAt: Date.now(),
  });

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
