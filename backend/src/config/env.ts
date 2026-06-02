import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  JWT_SECRET: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL: process.env.AI_MODEL ?? "claude-sonnet-4-6",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  REDIS_URL: process.env.REDIS_URL, // e.g. redis://localhost:6379 — enables cache, queue, pub/sub
  INSTANCE_ID: process.env.INSTANCE_ID ?? `api-${process.pid}`, // identifies the node behind the load balancer
  // Only send the Secure cookie flag when actually served over HTTPS. Defaults
  // off so the app works over plain HTTP (local + Docker demo); set true in prod.
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  isProd: process.env.NODE_ENV === "production",
};

/** Human-readable name of the active AI provider (for logs/banners). */
export function aiProviderName(): string {
  if (env.GROQ_API_KEY) return `Groq (${env.GROQ_MODEL})`;
  if (env.GEMINI_API_KEY) return `Google Gemini (${env.GEMINI_MODEL})`;
  if (env.ANTHROPIC_API_KEY) return `Anthropic (${env.AI_MODEL})`;
  return "deterministic fallback";
}
