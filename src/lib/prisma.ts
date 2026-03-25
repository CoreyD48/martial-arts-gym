// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.
//
// Prisma v7 requires a driver adapter — datasource URL no longer lives in schema.prisma.
// PrismaPg is passed to PrismaClient constructor with the connection string.
//
// Error logging added: createPrismaClient now catches and logs any initialisation
// error (missing DATABASE_URL, bad connection string, adapter failure) before
// rethrowing, so the actual message appears in Railway's log stream instead of
// causing a silent crash.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });
    console.log("[prisma] PrismaClient initialised successfully");
    return client;
  } catch (err) {
    console.error("[prisma] Failed to initialise PrismaClient:", err);
    throw err;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy proxy: the module can be imported at build time without DATABASE_URL.
// The client is created on first property access (i.e. first actual query).
// Any error thrown by createPrismaClient is logged inside that function and
// then propagated to the caller so the request handler can return a 500.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const value = (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
