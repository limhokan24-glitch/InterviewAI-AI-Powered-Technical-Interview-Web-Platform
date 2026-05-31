import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, notFound, badRequest } from "../lib/errors";
import { requireAuth } from "../lib/auth";
import { toProblem } from "../lib/serialize";
import { generateChallenge } from "../services/ai";

export const problemsRouter = Router();

// GET /api/problems/:id   (router mounted at /api)
problemsRouter.get(
  "/problems/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!p) throw notFound("Problem not found");
    res.json(toProblem(p));
  })
);

const genSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().optional(),
});

// POST /api/ai/challenges  — generate a new challenge and persist it
problemsRouter.post(
  "/ai/challenges",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = genSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("difficulty is required");
    const { difficulty, topic } = parsed.data;

    const c = generateChallenge(difficulty, topic);
    const created = await prisma.problem.create({
      data: {
        title: c.title,
        difficulty,
        tags: JSON.stringify(c.tags),
        prompt: c.prompt,
        starterCode: JSON.stringify(c.starterCode),
        examples: JSON.stringify(c.examples),
        generated: true,
      },
    });
    res.status(201).json(toProblem(created));
  })
);
