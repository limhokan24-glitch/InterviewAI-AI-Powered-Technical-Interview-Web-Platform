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
  isProd: process.env.NODE_ENV === "production",
};
