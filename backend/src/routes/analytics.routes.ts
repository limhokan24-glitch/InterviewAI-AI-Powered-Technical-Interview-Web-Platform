import { Router } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../lib/errors";
import { requireAuth } from "../lib/auth";
import { cached } from "../lib/cache";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const TTL = 15; // seconds — analytics are cached briefly to cut DB load under concurrency

// GET /api/analytics/stats
analyticsRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const data = await cached("analytics:stats", TTL, async () => {
      const [sessions, candidates] = await Promise.all([
        prisma.session.findMany(),
        prisma.user.count({ where: { role: "candidate" } }),
      ]);
      const completed = sessions.filter((s) => s.status === "completed" && s.score != null);
      const avgScore = completed.length ? Math.round(completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length) : 0;
      const durations = completed.filter((s) => s.durationMin != null);
      const avgDurationMin = durations.length ? Math.round(durations.reduce((a, s) => a + (s.durationMin ?? 0), 0) / durations.length) : 0;
      const passRate = completed.length ? Math.round((completed.filter((s) => (s.score ?? 0) >= 60).length / completed.length) * 100) : 0;
      return {
        totalInterviews: sessions.length,
        activeSessions: sessions.filter((s) => s.status === "active").length,
        avgScore,
        passRate,
        totalCandidates: candidates,
        avgDurationMin,
      };
    });
    res.json(data);
  })
);

// GET /api/analytics/timeseries  (last 14 days)
analyticsRouter.get(
  "/timeseries",
  asyncHandler(async (_req, res) => {
    const out = await cached("analytics:timeseries", TTL, async () => {
      const sessions = await prisma.session.findMany();
      const days = 14;
      return Array.from({ length: days }, (_, i) => {
        const day = new Date(Date.now() - (days - 1 - i) * 86400_000);
        const label = day.toLocaleDateString([], { month: "short", day: "numeric" });
        const sameDay = sessions.filter((s) => new Date(s.createdAt).toDateString() === day.toDateString());
        const scored = sameDay.filter((s) => s.score != null);
        const avgScore = scored.length ? Math.round(scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length) : 0;
        return { date: label, interviews: sameDay.length, avgScore };
      });
    });
    res.json(out);
  })
);

// GET /api/analytics/score-distribution
analyticsRouter.get(
  "/score-distribution",
  asyncHandler(async (_req, res) => {
    const out = await cached("analytics:dist", TTL, async () => {
      const sessions = await prisma.session.findMany({ where: { score: { not: null } } });
      const buckets = [
        { bucket: "0-20", min: 0, max: 20 },
        { bucket: "21-40", min: 21, max: 40 },
        { bucket: "41-60", min: 41, max: 60 },
        { bucket: "61-80", min: 61, max: 80 },
        { bucket: "81-100", min: 81, max: 100 },
      ];
      return buckets.map((b) => ({
        bucket: b.bucket,
        count: sessions.filter((s) => (s.score ?? -1) >= b.min && (s.score ?? -1) <= b.max).length,
      }));
    });
    res.json(out);
  })
);

// GET /api/analytics/languages
analyticsRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    const out = await cached("analytics:languages", TTL, async () => {
      const sessions = await prisma.session.findMany();
      const counts = new Map<string, number>();
      for (const s of sessions) counts.set(s.language, (counts.get(s.language) ?? 0) + 1);
      const label = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);
      const data = [...counts.entries()].map(([language, value]) => ({ language: label(language), value }));
      return data.length ? data : [{ language: "JavaScript", value: 1 }];
    });
    res.json(out);
  })
);

// GET /api/analytics/activity
analyticsRouter.get(
  "/activity",
  asyncHandler(async (_req, res) => {
    const out = await cached("analytics:activity", TTL, async () => {
      const sessions = await prisma.session.findMany({ orderBy: { createdAt: "desc" }, take: 8 });
      const events = sessions.map((s) => {
        if (s.status === "completed")
          return { id: "a_" + s.id, type: "session_completed", message: `${s.candidateName} completed '${s.title}' (${s.score ?? 0}%)`, at: (s.endedAt ?? s.createdAt).getTime() };
        if (s.status === "active")
          return { id: "a_" + s.id, type: "session_started", message: `${s.candidateName} started '${s.title}'`, at: (s.startedAt ?? s.createdAt).getTime() };
        return { id: "a_" + s.id, type: "joined", message: `Session scheduled: '${s.title}'`, at: s.createdAt.getTime() };
      });
      return events.sort((a, b) => b.at - a.at);
    });
    res.json(out);
  })
);
