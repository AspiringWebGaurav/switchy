import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import {
  createProject,
  getProjectsByOwner,
} from "@/lib/services/project.service";
import { getModePolicy } from "@/lib/services/policy.service";
import { createProjectSchema } from "@/lib/validators/project";
import { success, error } from "@/lib/utils/response";

export async function GET() {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  const projects = await getProjectsByOwner(user.uid);

  // Attach current mode to each project
  const projectsWithMode = await Promise.all(
    projects.map(async (project) => {
      const policy = await getModePolicy(project.id);
      return {
        ...project,
        mode: policy?.value ?? "live",
      };
    })
  );

  return success(projectsWithMode);
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    const project = await createProject(user.uid, parsed.data.name);
    const policy = await getModePolicy(project.id);

    return success({ ...project, mode: policy?.value ?? "live" }, 201);
  } catch (err) {
    console.error("[Projects] Create failed:", err);
    return error("Failed to create project", 500);
  }
}
