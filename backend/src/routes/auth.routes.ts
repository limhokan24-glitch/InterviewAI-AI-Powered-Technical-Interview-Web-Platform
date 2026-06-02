import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler, badRequest, conflict, unauthorized } from "../lib/errors";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../lib/auth";
import { toUser } from "../lib/serialize";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["candidate", "interviewer"]).default("candidate"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0].message);
    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict("An account with this email already exists.");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

    const token = signToken({ sub: user.id, role: user.role, name: user.name, email: user.email });
    setAuthCookie(res, token);
    // Also return the token so the client can use header auth (robust across
    // domains where third-party cookies are blocked).
    res.status(201).json({ ...toUser(user), token });
  })
);

// POST /api/auth/login
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Email and password are required.");
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Invalid email or password.");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid email or password.");

    const token = signToken({ sub: user.id, role: user.role, name: user.name, email: user.email });
    setAuthCookie(res, token);
    res.json({ ...toUser(user), token });
  })
);

// POST /api/auth/logout
authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

// GET /api/auth/me  — current session
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw unauthorized("Session no longer valid.");
    res.json(toUser(user));
  })
);
