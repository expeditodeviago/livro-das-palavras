import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const words = await db.word.findMany({
      include: { progress: true },
      orderBy: { rank: "asc" }
    });
    return NextResponse.json(words);
  } catch (error) {
    return NextResponse.json({ error: "Falha ao carregar a biblioteca" }, { status: 500 });
  }
}
