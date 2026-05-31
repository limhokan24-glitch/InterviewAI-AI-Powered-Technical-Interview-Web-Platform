import { createServer } from "node:http";
import { createApp } from "./app";
import { setupWebSocket } from "./realtime/ws";
import { env, aiProviderName } from "./config/env";
import { redisEnabled } from "./config/redis";
import { startCodeWorker } from "./queue/codeQueue";

const app = createApp();
const server = createServer(app);
setupWebSocket(server);

// Run a code-execution worker in-process when Redis is on (Docker can also run
// dedicated `npm run worker` containers to scale this out).
if (redisEnabled) startCodeWorker();

server.listen(env.PORT, () => {
  console.log(`\n  InterviewAI API  →  http://localhost:${env.PORT}  [${env.INSTANCE_ID}]`);
  console.log(`  WebSocket        →  ws://localhost:${env.PORT}/ws`);
  console.log(`  CORS origin      →  ${env.CLIENT_ORIGIN}`);
  console.log(`  AI provider      →  ${aiProviderName()}`);
  console.log(`  Redis            →  ${redisEnabled ? "enabled (cache + queue + pub/sub)" : "disabled (in-memory fallback)"}\n`);
});
