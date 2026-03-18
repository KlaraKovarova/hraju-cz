import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ""),
  };
}

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
  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    ...dbConfig,
    connectTimeout: 5000,
    socketTimeout: 5000,
  });
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
