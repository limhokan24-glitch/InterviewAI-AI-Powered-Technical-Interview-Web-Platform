// ─────────────────────────────────────────────────────────────────────────────
// Service configuration.
//
// The frontend is built against an abstract service layer. While the backend
// team's API is not ready, USE_MOCKS=true serves data locally. When the real
// backend exists, flip USE_MOCKS to false (or set VITE_USE_MOCKS=false) and the
// HTTP/WebSocket clients will talk to the real endpoints below — no UI changes.
// ─────────────────────────────────────────────────────────────────────────────

const env = import.meta.env;

export const config = {
  USE_MOCKS: env.VITE_USE_MOCKS ? env.VITE_USE_MOCKS === "true" : true,
  API_BASE_URL: env.VITE_API_BASE_URL ?? "http://localhost:4000/api",
  WS_URL: env.VITE_WS_URL ?? "ws://localhost:4000/ws",
};
