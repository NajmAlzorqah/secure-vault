import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const originalUrl = process.env.DATABASE_URL;
  let connectionString = originalUrl;
  if (originalUrl) {
    const url = new URL(originalUrl);
    url.searchParams.set("application_name", "vault_app");
    connectionString = url.toString();
  }

  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
