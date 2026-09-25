import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(50, "Project name must be 50 characters or less"),
});

export const projectVisibilitySettingsSchema = z.object({
  devOverlayEnabled: z.boolean().nullable().optional(),
  devBlocklist: z.array(z.string().trim().min(1)).nullable().optional(),
  domainAllowlist: z.array(z.string().trim().min(1)).nullable().optional(),
  domainBlocklist: z.array(z.string().trim().min(1)).nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(50, "Project name must be 50 characters or less")
    .optional(),
  enabled: z.boolean().optional(),
  settings: projectVisibilitySettingsSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectVisibilitySettingsInput = z.infer<typeof projectVisibilitySettingsSchema>;
