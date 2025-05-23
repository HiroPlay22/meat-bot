// database/client.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Verhindert Hot-Reload-Dopplung bei Next.js / tsx / dev-Mode
  // (wird bei dir vermutlich auch genutzt)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
