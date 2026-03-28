import { z } from "zod";

export const updatePolicySchema = z.object({
  value: z.enum(["live", "maintenance", "custom", "preview", "medical", "brb", "vacation", "focus", "working", "launching", "migrating", "deploying", "incident", "degraded", "outage", "closed", "coming-soon", "paused", "moved", "beta", "holiday", "offline"]),
  config: z
    .object({
      message: z.string().max(500).nullable().optional(),
      buttonText: z.string().max(100).nullable().optional(),
      redirectUrl: z.string().url().max(2000).nullable().optional(),
    })
    .optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
