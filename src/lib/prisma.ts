import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a no-op proxy so builds succeed without DATABASE_URL.
    // Any query will throw, caught by try/catch in data.ts → falls back to mock data.
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("DATABASE_URL is not configured");
      },
    });
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
