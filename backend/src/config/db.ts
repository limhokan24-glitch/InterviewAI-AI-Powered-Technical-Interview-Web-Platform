import { PrismaClient } from "@prisma/client";

// Single shared Prisma client (avoids exhausting connections on hot-reload).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
});
