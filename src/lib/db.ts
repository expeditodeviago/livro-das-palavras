import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  prismaInstance = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "dev.db");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const db = prismaInstance;
