import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.livrodaspalavras_PRISMA_DATABASE_URL ||
  process.env.livrodaspalavras_POSTGRES_URL ||
  Object.values(process.env).find(v => typeof v === 'string' && v.startsWith('postgres://') && v.includes('prisma.io')) as string;

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString, ssl: true }))
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
