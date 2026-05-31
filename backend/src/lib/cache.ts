// ─────────────────────────────────────────────────────────────────────────────
// Cache abstraction. Uses Redis when available, otherwise an in-process Map with
// TTL. Same API either way, so call sites don't care which backend is active.
// ─────────────────────────────────────────────────────────────────────────────

import { getRedis, redisEnabled } from "../config/redis";

interface MemEntry {
  value: string;
  expiresAt: number;
}
const memStore = new Map<string, MemEntry>();

/** Get a cached JSON value, or null on miss. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redisEnabled) {
    try {
      const raw = await getRedis()!.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // never let a cache hiccup break the request
    }
  }
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

/** Store a JSON value with a TTL (seconds). */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value);
  if (redisEnabled) {
    try {
      await getRedis()!.set(key, raw, "EX", ttlSeconds);
    } catch {
      /* ignore */
    }
    return;
  }
  memStore.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Invalidate keys matching a prefix (e.g. "analytics:") after a write. */
export async function cacheInvalidate(prefix: string): Promise<void> {
  if (redisEnabled) {
    try {
      const r = getRedis()!;
      const keys = await r.keys(`${prefix}*`);
      if (keys.length) await r.del(...keys);
    } catch {
      /* ignore */
    }
    return;
  }
  for (const k of memStore.keys()) if (k.startsWith(prefix)) memStore.delete(k);
}

/** Wrap an async producer with read-through caching. */
export async function cached<T>(key: string, ttlSeconds: number, produce: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await produce();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
