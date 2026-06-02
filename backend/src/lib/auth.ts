import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { unauthorized } from "./errors";

export interface JwtPayload {
  sub: string; // user id
  role: string;
  name: string;
  email: string;
}

const COOKIE = "interviewai_token";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

/** Sets the auth token as an httpOnly cookie (the frontend sends credentials). */
export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE);
}

/** Reads & verifies the token from the cookie (or Authorization: Bearer). */
function readToken(req: Request): JwtPayload | null {
  const fromCookie = req.cookies?.[COOKIE];
  const fromHeader = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = fromCookie ?? fromHeader;
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Augment Express Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Hard guard: rejects the request if not authenticated. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (!user) return next(unauthorized("Invalid or missing session"));
  req.user = user;
  next();
}

/** Soft: attaches user if present but never blocks. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (user) req.user = user;
  next();
}
