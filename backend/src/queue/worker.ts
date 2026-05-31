// Standalone queue-worker entrypoint. Run as its own process/container:
//   npm run worker
// Lets you scale code execution independently of the API (horizontal workers).

import { startCodeWorker } from "./codeQueue";
import { redisEnabled } from "../config/redis";

if (!redisEnabled) {
  console.error("Worker requires REDIS_URL to be set. Exiting.");
  process.exit(1);
}

const worker = startCodeWorker();
console.log("InterviewAI queue worker started, waiting for jobs…");

process.on("SIGTERM", async () => {
  await worker?.close();
  process.exit(0);
});
