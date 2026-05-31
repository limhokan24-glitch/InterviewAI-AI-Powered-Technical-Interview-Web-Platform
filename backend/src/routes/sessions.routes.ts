import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, badRequest, notFound } from "../lib/errors";
import { requireAuth } from "../lib/auth";
import { toSession, toMessage, toEvaluation } from "../lib/serialize";
import { streamReply, streamFollowUp, reviewCode, evaluate, analyzeIntegrity } from "../services/ai";
import { enqueueAndRun } from "../queue/codeQueue";
import { broadcast, emitActivity } from "../realtime/ws";
import { cacheInvalidate } from "../lib/cache";

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

async function getSessionOr404(id: string) {
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) throw notFound("Interview session not found");
  return s;
}

// GET /api/sessions
sessionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const sessions = await prisma.session.findMany({ orderBy: { createdAt: "desc" } });
    res.json(sessions.map(toSession));
  })
);

// GET /api/sessions/:id
sessionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const s = await getSessionOr404(req.params.id);
    res.json(toSession(s));
  })
);

const createSchema = z.object({
  title: z.string().default("Untitled Interview"),
  candidateName: z.string().default("Anonymous"),
  problemId: z.string(),
  language: z.string().default("javascript"),
});

// POST /api/sessions
sessionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("problemId is required");
    const { title, candidateName, problemId, language } = parsed.data;

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw badRequest("Unknown problemId");

    const s = await prisma.session.create({
      data: {
        title,
        candidateName,
        problemId,
        language,
        status: "active",
        startedAt: new Date(),
        interviewerName: "AI Interviewer",
        candidateId: req.user!.sub,
      },
    });
    await cacheInvalidate("analytics:");
    res.status(201).json(toSession(s));
  })
);

// GET /api/sessions/:id/messages
sessionsRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const messages = await prisma.message.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    // Seed an opening message the first time the room is opened.
    if (messages.length === 0) {
      const opener = await prisma.message.create({
        data: {
          sessionId: req.params.id,
          role: "ai",
          content:
            "Hi! I'm your AI interviewer today. We'll work through a coding problem together. Take your time, think out loud, and ask clarifying questions. Ready to start?",
        },
      });
      return res.json([toMessage(opener)]);
    }
    res.json(messages.map(toMessage));
  })
);

const chatSchema = z.object({ content: z.string().min(1) });

// POST /api/sessions/:id/chat  — streams the AI reply token-by-token
sessionsRouter.post(
  "/:id/chat",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("content is required");

    // Persist the user's message.
    await prisma.message.create({ data: { sessionId: req.params.id, role: "user", content: parsed.data.content } });
    const history = await prisma.message.findMany({ where: { sessionId: req.params.id }, orderBy: { createdAt: "asc" } });

    // Stream as chunked plain text; the client reads the body progressively.
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    let full = "";
    try {
      for await (const tok of streamReply(parsed.data.content, history.map((m) => ({ role: m.role, content: m.content })))) {
        full += tok;
        res.write(tok);
      }
    } catch {
      if (!full) {
        res.statusCode = 502;
        return res.end("The AI service is temporarily unavailable.");
      }
    }
    await prisma.message.create({ data: { sessionId: req.params.id, role: "ai", content: full } });
    res.end();
  })
);

const runSchema = z.object({ language: z.string(), code: z.string() });

// POST /api/sessions/:id/run  — execute code
sessionsRouter.post(
  "/:id/run",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("language and code are required");

    const result = await enqueueAndRun(parsed.data.language, parsed.data.code);
    emitActivity(req.params.id, "code_run", `Code executed — ${result.testsPassed}/${result.testsTotal} tests`);
    // The follow-up question is requested separately by the client via /followup
    // (so it can stream into the chat), keeping a single source of truth.
    res.json(result);
  })
);

// ── Cheating detection / proctoring ──────────────────────────────────────────

const proctorSchema = z.object({
  type: z.enum(["paste", "large_paste", "blur", "focus", "devtools"]),
  detail: z.string().optional(),
});

// POST /api/sessions/:id/proctor  — log an integrity signal
sessionsRouter.post(
  "/:id/proctor",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = proctorSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("invalid proctor event");
    await prisma.proctorEvent.create({ data: { sessionId: req.params.id, type: parsed.data.type, detail: parsed.data.detail } });
    res.status(204).end();
  })
);

// GET /api/sessions/:id/integrity  — proctoring summary + risk score
sessionsRouter.get(
  "/:id/integrity",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const events = await prisma.proctorEvent.findMany({ where: { sessionId: req.params.id } });
    res.json(analyzeIntegrity(events));
  })
);

const followUpSchema = z.object({ passed: z.number().int().nonnegative(), total: z.number().int().nonnegative() });

// POST /api/sessions/:id/followup  — streams a proactive AI follow-up after a run
sessionsRouter.post(
  "/:id/followup",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = followUpSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("passed and total are required");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    let full = "";
    for await (const tok of streamFollowUp(parsed.data.passed, parsed.data.total)) {
      full += tok;
      res.write(tok);
    }
    await prisma.message.create({ data: { sessionId: req.params.id, role: "ai", content: full } });
    res.end();
  })
);

const codeSchema = z.object({ code: z.string(), language: z.string().optional() });

// PATCH /api/sessions/:id/code  — autosave
sessionsRouter.patch(
  "/:id/code",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = codeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("code is required");

    await prisma.codeSnapshot.upsert({
      where: { sessionId: req.params.id },
      update: { code: parsed.data.code, language: parsed.data.language ?? "javascript" },
      create: { sessionId: req.params.id, code: parsed.data.code, language: parsed.data.language ?? "javascript" },
    });
    broadcast(req.params.id, { type: "code:update", sessionId: req.params.id, code: parsed.data.code });
    res.status(204).end();
  })
);

// POST /api/sessions/:id/review  — AI reviews the current code
sessionsRouter.post(
  "/:id/review",
  asyncHandler(async (req, res) => {
    await getSessionOr404(req.params.id);
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("language and code are required");
    res.json(reviewCode(parsed.data.language, parsed.data.code));
  })
);

// POST /api/sessions/:id/evaluate  — final AI evaluation (persisted)
sessionsRouter.post(
  "/:id/evaluate",
  asyncHandler(async (req, res) => {
    const s = await getSessionOr404(req.params.id);
    const snap = await prisma.codeSnapshot.findUnique({ where: { sessionId: s.id } });
    const ratio = snap ? 0.85 : 0.7;
    const e = evaluate(ratio);

    const saved = await prisma.evaluation.upsert({
      where: { sessionId: s.id },
      update: { ...e, strengths: JSON.stringify(e.strengths), improvements: JSON.stringify(e.improvements) },
      create: { sessionId: s.id, ...e, strengths: JSON.stringify(e.strengths), improvements: JSON.stringify(e.improvements) },
    });

    // Mark the session complete with the overall score.
    await prisma.session.update({
      where: { id: s.id },
      data: { status: "completed", score: e.overall, endedAt: new Date() },
    });
    emitActivity(s.id, "evaluation", `AI evaluation completed (${e.overall}%)`);
    broadcast(s.id, { type: "session:status", sessionId: s.id, status: "completed" });
    await cacheInvalidate("analytics:");

    res.json(toEvaluation(saved));
  })
);
