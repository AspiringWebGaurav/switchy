import type { ModeValue } from "@/types/policy";
import type { AuditAction } from "@/types/audit";
import { LocalEventBus } from "./local-bus";

export interface ModeEvent {
  projectId: string;
  mode: ModeValue;
  message: string | null;
  buttonText: string | null;
  redirect: string | null;
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
export type AuditEventHandler = (event: AuditEvent) => void;
export type EventHandler = ModeEventHandler | AuditEventHandler;

export interface EventBus {
  emit(channel: string, payload: ModeEvent | AuditEvent): void;
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
