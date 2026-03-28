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
  updatedAt: number;
  updatedBy: string;
}
