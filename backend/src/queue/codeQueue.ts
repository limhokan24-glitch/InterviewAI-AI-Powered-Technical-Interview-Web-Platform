// ─────────────────────────────────────────────────────────────────────────────
// Code-execution queue. When Redis is available, /run enqueues a job that a
// worker processes (so heavy/sandboxed execution can be scaled out to dedicated
// worker processes/containers). Without Redis it runs inline. Same return value
// either way, so the API contract is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { Queue, Worker, QueueEvents } from "bullmq";
import { bullConnection } from "../config/redis";
import { runCode, type CodeRunResult } from "../services/runner";

const QUEUE_NAME = "code-execution";

const connection = bullConnection();
const queue = connection ? new Queue(QUEUE_NAME, { connection }) : null;
let queueEvents: QueueEvents | null = null;

/** Enqueue a run and await its result; falls back to inline execution. */
export async function enqueueAndRun(language: string, code: string): Promise<CodeRunResult> {
  if (!queue || !connection) {
    return runCode(language, code); // no Redis → run inline
  }
  if (!queueEvents) {
    queueEvents = new QueueEvents(QUEUE_NAME, { connection });
    await queueEvents.waitUntilReady();
  }
  const job = await queue.add("run", { language, code }, { removeOnComplete: true, removeOnFail: 50 });
  return (await job.waitUntilFinished(queueEvents)) as CodeRunResult;
}

/** Start a worker that processes code-execution jobs. Called by the server (when
 *  Redis is present) and by the standalone worker entrypoint (worker.ts). */
export function startCodeWorker(): Worker | null {
  if (!connection) return null;
  const worker = new Worker<{ language: string; code: string }, CodeRunResult>(
    QUEUE_NAME,
    async (job) => runCode(job.data.language, job.data.code),
    { connection, concurrency: 4 }
  );
  worker.on("ready", () => console.log("[queue] code-execution worker ready"));
  worker.on("failed", (job, err) => console.warn(`[queue] job ${job?.id} failed:`, err.message));
  return worker;
}
