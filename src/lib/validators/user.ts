import { z } from "zod";

export const updatePreferencesSchema = z.object({
  devOverlayEnabled: z.boolean().optional(),
  devBlocklist: z.array(z.string().trim().min(1)).optional(),
  domainAllowlist: z.array(z.string().trim().min(1)).optional(),
  domainBlocklist: z.array(z.string().trim().min(1)).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

