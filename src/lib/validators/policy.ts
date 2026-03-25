import { z } from "zod";

export const updatePolicySchema = z.object({
  value: z.enum(["live", "maintenance", "custom"]),
  config: z
    .object({
      message: z.string().max(500).nullable().optional(),
      buttonText: z.string().max(100).nullable().optional(),
      redirectUrl: z.string().url().nullable().optional(),
    })
    .optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
