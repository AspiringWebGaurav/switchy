export type ModeValue = "live" | "maintenance" | "custom";

export interface ModeConfig {
  message: string | null;
  buttonText: string | null;
  redirectUrl: string | null;
}

export interface ModePolicy {
  type: "mode";
  value: ModeValue;
  config: ModeConfig;
  updatedAt: number;
  updatedBy: string;
}
