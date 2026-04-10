import type { ModeValue } from "@/types/policy";
import type { AuditAction } from "@/types/audit";
import { LocalEventBus } from "./local-bus";

export interface ResolvedVisibility {
  devOverlayEnabled?: boolean | null;
  devBlocklist: string[];      // URL-level suppression (hostname or hostname:port)
  domainAllowlist: string[];
  domainBlocklist: string[];
}

export interface ModeEvent {
  projectId: string;
  mode: ModeValue;
  message: string | null;
  buttonText: string | null;
  redirect: string | null;
  version: number;
  timestamp: number;
  /** Resolved visibility config — included so SSE clients never need a separate /decide round-trip */
  visibility?: ResolvedVisibility;
}

export interface SettingsEvent {
  projectId: string;
  visibility: ResolvedVisibility;
  version: number;
  timestamp: number;
}

export interface AuditEvent {
  id: string;
  projectId: string;
  action: AuditAction;
  message: string;
  userEmail: string;
  timestamp: number;
  version: number;
}

export type ModeEventHandler = (event: ModeEvent) => void;
export type SettingsEventHandler = (event: SettingsEvent) => void;
export type AuditEventHandler = (event: AuditEvent) => void;
export type EventHandler = ModeEventHandler | SettingsEventHandler | AuditEventHandler;

export interface EventBus {
  emit(channel: string, payload: ModeEvent | SettingsEvent | AuditEvent): void;
  on(channel: string, handler: EventHandler): void;
  off(channel: string, handler: EventHandler): void;
}

const _g = globalThis as typeof globalThis & { __switchy_event_bus__?: EventBus };
if (!_g.__switchy_event_bus__) {
  _g.__switchy_event_bus__ = new LocalEventBus();
}

export function getEventBus(): EventBus {
  return _g.__switchy_event_bus__!;
}
