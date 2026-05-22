import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // No-op proxy so builds and server-rendering survive without DATABASE_URL.
    // Methods return rejected Promises (instead of throwing synchronously) so
    // callers using .catch() — including data.ts fallbacks and the per-query
    // .catch() blocks on facility pages — actually run.
    const rejectErr = () =>
      Promise.reject(new Error("DATABASE_URL is not configured"));
    const modelProxy: unknown = new Proxy(
      {},
      {
        get: () => rejectErr,
      },
    );
    return new Proxy({} as PrismaClient, {
      get: () => modelProxy,
    });
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
