import type { CodeRunResult } from "@/services/types";

// Tiny event bus scoped to the interview room so independent panels (editor,
// chat) can react to each other without prop-drilling or shared parent state.
type RoomEvents = {
  "code:ran": { result: CodeRunResult };
};

type Handler<T> = (payload: T) => void;

class RoomBus {
  private handlers: { [K in keyof RoomEvents]?: Set<Handler<RoomEvents[K]>> } = {};

  on<K extends keyof RoomEvents>(event: K, fn: Handler<RoomEvents[K]>) {
    (this.handlers[event] ??= new Set()).add(fn);
    return () => {
      this.handlers[event]?.delete(fn);
    };
  }

  emit<K extends keyof RoomEvents>(event: K, payload: RoomEvents[K]) {
    this.handlers[event]?.forEach((fn) => fn(payload));
  }
}

export const roomBus = new RoomBus();
