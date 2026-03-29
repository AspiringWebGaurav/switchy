import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

export const updatePolicySchema = z.object({
  value: z.enum(["live", "maintenance", "custom", "preview", "medical", "brb", "vacation", "focus", "working", "launching", "migrating", "deploying", "incident", "degraded", "outage", "closed", "coming-soon", "paused", "moved", "beta", "holiday", "offline"]),
  config: z
    .object({
      message: emptyToNull(z.string().max(500).nullable().optional()),
      buttonText: emptyToNull(z.string().max(100).nullable().optional()),
      redirectUrl: emptyToNull(z.string().url().max(2000).nullable().optional()),
    })
    .optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
