import type { ModeValue } from "@/types/policy";
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

export type ModeEventHandler = (event: ModeEvent) => void;

export interface EventBus {
  emit(channel: string, payload: ModeEvent): void;
  on(channel: string, handler: ModeEventHandler): void;
  off(channel: string, handler: ModeEventHandler): void;
}

const _g = globalThis as typeof globalThis & { __switchy_event_bus__?: EventBus };
if (!_g.__switchy_event_bus__) {
  _g.__switchy_event_bus__ = new LocalEventBus();
}

export function getEventBus(): EventBus {
  return _g.__switchy_event_bus__!;
}
