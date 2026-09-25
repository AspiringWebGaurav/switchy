export type ModeValue =
  | "live"
  | "maintenance"
  | "custom"
  | "preview"
  | "medical"
  | "brb"
  | "vacation"
  | "focus"
  | "working"
  | "launching"
  | "migrating"
  | "deploying"
  | "incident"
  | "degraded"
  | "outage"
  | "closed"
  | "coming-soon"
  | "paused"
  | "moved"
  | "beta"
  | "holiday"
  | "offline";

export interface ModeConfig {
  message: string | null;
  buttonText: string | null;
  redirectUrl: string | null;
}

export interface ModePolicy {
  type: "mode";
  value: ModeValue;
  config: ModeConfig;
  customConfig: ModeConfig | null; // Persisted custom mode config - restored when switching back to custom
  activePresetId?: string; // Currently active preset ID (for custom mode)
  updatedAt: number;
  updatedBy: string;
}

export interface CustomPreset {
  id: string;
  name: string;
  config: ModeConfig;
  createdAt: number;
  updatedAt: number;
}
