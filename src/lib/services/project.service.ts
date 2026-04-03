import { adminDb } from "@/lib/firebase/admin";
import { generatePublicKey } from "@/lib/utils/keys";
import { DEFAULT_MODE_POLICY } from "@/config/policies";
import { redisDel } from "@/lib/redis/client";
import type { Project } from "@/types/project";
import type { ModePolicy } from "@/types/policy";

const projectsRef = adminDb.collection("projects");

export async function createProject(
  ownerId: string,
  name: string
): Promise<Project> {
  const now = Date.now();
  const docRef = projectsRef.doc();
  const project: Project = {
    id: docRef.id,
    ownerId,
    name,
    publicKey: generatePublicKey(),
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(project);

  // Create default mode policy
  const policy: ModePolicy = {
    ...DEFAULT_MODE_POLICY,
    updatedAt: now,
    updatedBy: ownerId,
  };
  await docRef.collection("policies").doc("mode").set(policy);

  return project;
}

export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const snapshot = await projectsRef
    .where("ownerId", "==", ownerId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as Project);
}

export async function getProjectById(
  projectId: string
): Promise<Project | null> {
  try {
    const doc = await projectsRef.doc(projectId).get();
    if (!doc.exists) return null;
    return doc.data() as Project;
  } catch {
    return null;
  }
}

export async function getProjectByPublicKey(
  projectId: string,
  publicKey: string
): Promise<Project | null> {
  const project = await getProjectById(projectId);
  if (!project || project.publicKey !== publicKey) return null;
  return project;
}

export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project, "name" | "enabled" | "detected" | "activeTemplateId">>
): Promise<void> {
  await projectsRef.doc(projectId).update({
    ...data,
    updatedAt: Date.now(),
  });

  // Invalidate decision cache when settings change
  if (data.enabled !== undefined || data.activeTemplateId !== undefined) {
    await redisDel(`decide:${projectId}`);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const docRef = projectsRef.doc(projectId);

  // Delete policies sub-collection
  const policies = await docRef.collection("policies").get();
  const batch = adminDb.batch();
  policies.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(docRef);

  await batch.commit();

  // Invalidate decision cache
  await redisDel(`decide:${projectId}`);
}
