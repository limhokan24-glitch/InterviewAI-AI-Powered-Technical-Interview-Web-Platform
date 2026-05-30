import { useEffect, useState } from "react";
import { realtime } from "@/services/realtime";
import type { ConnectionState, WsEvent } from "@/services/types";

/**
 * Manages the realtime connection lifecycle for a session and exposes the
 * current connection state plus a subscribe helper for incoming events.
 */
export function useRealtime(sessionId: string, onEvent?: (e: WsEvent) => void) {
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    realtime.connect(sessionId);
    const offState = realtime.onState(setState);
    return () => {
      offState();
      realtime.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!onEvent) return;
    const off = realtime.on(onEvent);
    return () => {
      off();
    };
  }, [onEvent]);

  return {
    state,
    send: realtime.send.bind(realtime),
    simulateDrop: realtime.simulateDrop.bind(realtime),
  };
}
