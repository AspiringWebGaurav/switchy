import { EventEmitter } from "events";
import type { EventBus, ModeEvent, ModeEventHandler } from "./bus";

export class LocalEventBus implements EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(0);
  }

  emit(channel: string, payload: ModeEvent): void {
    this.emitter.emit(channel, payload);
  }

  on(channel: string, handler: ModeEventHandler): void {
    this.emitter.on(channel, handler);
  }

  off(channel: string, handler: ModeEventHandler): void {
    this.emitter.off(channel, handler);
  }
}
