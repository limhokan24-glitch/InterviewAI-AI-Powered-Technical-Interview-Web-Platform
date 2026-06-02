import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorMiddleware } from "./lib/errors";
import { authRouter } from "./routes/auth.routes";
import { problemsRouter } from "./routes/problems.routes";
import { sessionsRouter } from "./routes/sessions.routes";
import { analyticsRouter } from "./routes/analytics.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true, // allow the auth cookie
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true, service: "interviewai-api", instance: env.INSTANCE_ID }));

  // All API routes are under /api to match the frontend's VITE_API_BASE_URL.
  app.use("/api/auth", authRouter);
  app.use("/api", problemsRouter); // /api/problems/:id and /api/ai/challenges
  app.use("/api/sessions", sessionsRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use(errorMiddleware);
  return app;
}
