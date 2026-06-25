import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString, ssl: true }))
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
