// ─────────────────────────────────────────────────────────────────────────────
// Realtime client — abstracts the WebSocket connection.
//
// Mock mode simulates a live socket: connection lifecycle, reconnection with
// backoff, presence, and periodic activity events. The public surface
// (connect / send / on / disconnect) matches what a real WebSocket wrapper
// would expose, so swapping in a real `new WebSocket(config.WS_URL)` is local.
// ─────────────────────────────────────────────────────────────────────────────

import { config } from "./config";
import type { ConnectionState, WsEvent, ActivityEvent } from "./types";

type StateListener = (state: ConnectionState) => void;
type EventListener = (event: WsEvent) => void;

class RealtimeClient {
  private stateListeners = new Set<StateListener>();
  private eventListeners = new Set<EventListener>();
  private state: ConnectionState = "disconnected";
  private socket: WebSocket | null = null;
  private heartbeat?: ReturnType<typeof setInterval>;
  private sessionId?: string;
  private reconnectAttempts = 0;

  connect(sessionId: string) {
    this.sessionId = sessionId;
    this.setState("connecting");

    if (config.USE_MOCKS) {
      // Simulate handshake latency, then "connected".
      setTimeout(() => {
        this.setState("connected");
        this.reconnectAttempts = 0;
        this.emit({ type: "presence:join", sessionId, user: "AI Interviewer" });
        this.startMockHeartbeat();
      }, 600);
      return;
    }

    // Real implementation -------------------------------------------------------
    this.socket = new WebSocket(`${config.WS_URL}?session=${sessionId}`);
    this.socket.onopen = () => this.setState("connected");
    this.socket.onmessage = (e) => this.emit(JSON.parse(e.data) as WsEvent);
    this.socket.onclose = () => this.handleDrop();
    this.socket.onerror = () => this.handleDrop();
  }

  private startMockHeartbeat() {
    clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      if (this.state !== "connected" || !this.sessionId) return;
      // Occasionally push a synthetic activity event to feel "live".
      if (Math.random() < 0.25) {
        const messages = [
          "Candidate is typing…",
          "Code autosaved",
          "AI is analyzing the latest changes",
        ];
        const event: ActivityEvent = {
          id: "rt_" + Math.random().toString(36).slice(2, 7),
          type: "code_run",
          message: messages[Math.floor(Math.random() * messages.length)],
          at: Date.now(),
        };
        this.emit({ type: "activity", event });
      }
    }, 5000);
  }

  /** Simulate a dropped connection (used by the demo "drop" control). */
  simulateDrop() {
    if (!config.USE_MOCKS) return;
    this.handleDrop();
  }

  private handleDrop() {
    clearInterval(this.heartbeat);
    if (this.state === "disconnected") return;
    this.setState("reconnecting");
    this.reconnectAttempts++;
    const backoff = Math.min(1000 * 2 ** this.reconnectAttempts, 8000);
    setTimeout(() => {
      if (this.sessionId) this.connect(this.sessionId);
    }, backoff);
  }

  send(event: WsEvent) {
    if (config.USE_MOCKS) {
      // Echo code updates back so collaborators (and the activity feed) react.
      this.emit(event);
      return;
    }
    this.socket?.send(JSON.stringify(event));
  }

  disconnect() {
    clearInterval(this.heartbeat);
    this.socket?.close();
    this.socket = null;
    this.sessionId = undefined;
    this.setState("disconnected");
  }

  onState(fn: StateListener) {
    this.stateListeners.add(fn);
    fn(this.state);
    return () => this.stateListeners.delete(fn);
  }

  on(fn: EventListener) {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  getState() {
    return this.state;
  }

  private setState(s: ConnectionState) {
    this.state = s;
    this.stateListeners.forEach((fn) => fn(s));
  }

  private emit(e: WsEvent) {
    this.eventListeners.forEach((fn) => fn(e));
  }
}

export const realtime = new RealtimeClient();
