import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: (process.env.DATABASE_URL ?? "") + (process.env.DATABASE_URL?.includes("?") ? "&" : "?") + "connection_limit=1&pool_timeout=20",
      },
    },
  });

globalForPrisma.prisma = prisma;
