import { createServer } from "node:http";
import { createApp } from "./app";
import { setupWebSocket } from "./realtime/ws";
import { env } from "./config/env";

const app = createApp();
const server = createServer(app);
setupWebSocket(server);

server.listen(env.PORT, () => {
  console.log(`\n  InterviewAI API  →  http://localhost:${env.PORT}`);
  console.log(`  WebSocket        →  ws://localhost:${env.PORT}/ws`);
  console.log(`  CORS origin      →  ${env.CLIENT_ORIGIN}`);
  console.log(`  AI provider      →  ${env.ANTHROPIC_API_KEY ? "Anthropic" : "deterministic fallback"}\n`);
});
