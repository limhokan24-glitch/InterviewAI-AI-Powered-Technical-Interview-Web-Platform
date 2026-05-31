// ─────────────────────────────────────────────────────────────────────────────
// WebSocket server. Clients connect to  ws://host/ws?session=<id>  and exchange
// JSON `WsEvent` objects (matching the frontend's services/types.ts):
//   code:update | presence:join | presence:leave | session:status | activity
// ─────────────────────────────────────────────────────────────────────────────

import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

type WsEvent =
  | { type: "code:update"; sessionId: string; code: string }
  | { type: "presence:join"; sessionId: string; user: string }
  | { type: "presence:leave"; sessionId: string; user: string }
  | { type: "session:status"; sessionId: string; status: string }
  | { type: "activity"; event: { id: string; type: string; message: string; at: number } };

// sessionId -> set of connected sockets
const rooms = new Map<string, Set<WebSocket>>();

function join(sessionId: string, ws: WebSocket) {
  if (!rooms.has(sessionId)) rooms.set(sessionId, new Set());
  rooms.get(sessionId)!.add(ws);
}

function leave(sessionId: string, ws: WebSocket) {
  const room = rooms.get(sessionId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) rooms.delete(sessionId);
}

/** Send an event to everyone in a session room (optionally excluding sender). */
export function broadcast(sessionId: string, event: WsEvent, except?: WebSocket) {
  const room = rooms.get(sessionId);
  if (!room) return;
  const data = JSON.stringify(event);
  for (const client of room) {
    if (client !== except && client.readyState === WebSocket.OPEN) client.send(data);
  }
}

/** Convenience for emitting an activity event into a session room. */
export function emitActivity(sessionId: string, type: string, message: string) {
  broadcast(sessionId, {
    type: "activity",
    event: { id: "rt_" + Math.random().toString(36).slice(2, 8), type, message, at: Date.now() },
  });
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const sessionId = url.searchParams.get("session");
    if (!sessionId) {
      ws.close(1008, "Missing session");
      return;
    }

    join(sessionId, ws);
    // Tell the new client the AI interviewer is present.
    ws.send(JSON.stringify({ type: "presence:join", sessionId, user: "AI Interviewer" }));
    broadcast(sessionId, { type: "presence:join", sessionId, user: "A participant" }, ws);

    ws.on("message", (raw) => {
      let event: WsEvent;
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }
      // Relay code updates (and anything else) to the rest of the room.
      if (event.type === "code:update") {
        broadcast(sessionId, event, ws);
        emitActivity(sessionId, "code_run", "Code updated");
      } else {
        broadcast(sessionId, event, ws);
      }
    });

    ws.on("close", () => {
      leave(sessionId, ws);
      broadcast(sessionId, { type: "presence:leave", sessionId, user: "A participant" });
    });

    ws.on("error", () => leave(sessionId, ws));
  });

  // Lightweight keepalive so idle proxies don't drop the socket.
  const ping = setInterval(() => {
    for (const room of rooms.values()) for (const ws of room) if (ws.readyState === WebSocket.OPEN) ws.ping();
  }, 30_000);
  wss.on("close", () => clearInterval(ping));

  return wss;
}
