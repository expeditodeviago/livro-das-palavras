import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const fallbackUrl = "postgres://b219d59fe7c6c1c0b1669c5a23ba148b1bd2c04b844e40f66ccea3be7383a5c2:sk_3lnl43fY9updLeolLJgtY@db.prisma.io:5432/postgres?sslmode=require";

// Use the URL explicitly. Do NOT use process.env to avoid corrupted user variables in Vercel.
const connectionString = fallbackUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString, ssl: true }))
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
