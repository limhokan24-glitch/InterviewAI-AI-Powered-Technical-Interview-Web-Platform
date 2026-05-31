import type { NextFunction, Request, Response } from "express";

/** Error carrying an HTTP status code, thrown anywhere in the request flow. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const badRequest = (m: string) => new HttpError(400, m);
export const unauthorized = (m = "Unauthorized") => new HttpError(401, m);
export const notFound = (m = "Not found") => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);

/** Wraps async route handlers so thrown/rejected errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Central error handler — converts thrown errors into JSON responses. */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
