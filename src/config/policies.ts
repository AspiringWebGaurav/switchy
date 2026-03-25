import type { ModePolicy } from "@/types/policy";

export const DEFAULT_MODE_POLICY: ModePolicy = {
  type: "mode",
  value: "maintenance",
  config: {
    message: null,
    buttonText: null,
    redirectUrl: null,
  },
  updatedAt: Date.now(),
  updatedBy: "",
};
