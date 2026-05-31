// ─────────────────────────────────────────────────────────────────────────────
// Redis connections. Everything is OPTIONAL: if REDIS_URL is not set (or Redis
// is unreachable) the app degrades gracefully to in-process behavior, so local
// dev needs no Redis. With Docker Compose, REDIS_URL is provided and caching,
// queues, and cross-instance pub/sub all activate automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { Redis } from "ioredis";
import { env } from "./env";

export const redisEnabled = Boolean(env.REDIS_URL);

let client: Redis | null = null;

/** Shared Redis client (commands). Returns null when Redis isn't configured. */
export function getRedis(): Redis | null {
  if (!redisEnabled) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL!, { maxRetriesPerRequest: null, lazyConnect: false });
    client.on("error", (e) => console.warn("[redis] error:", e.message));
    client.on("connect", () => console.log("[redis] connected"));
  }
  return client;
}

/** A dedicated connection for pub/sub subscriptions (cannot run normal commands). */
export function createSubscriber(): Redis | null {
  if (!redisEnabled) return null;
  const sub = new Redis(env.REDIS_URL!, { maxRetriesPerRequest: null });
  sub.on("error", (e) => console.warn("[redis:sub] error:", e.message));
  return sub;
}

/** Connection options object BullMQ needs (it manages its own connections). */
export function bullConnection() {
  if (!env.REDIS_URL) return null;
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
  };
}
