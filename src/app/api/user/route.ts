import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    let prefs = await db.userPreferences.findUnique({ where: { userId } });
    if (!prefs) {
      prefs = await db.userPreferences.create({
        data: { userId, difficultyLevel: "APRENDIZ" }
      });
    }
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Erro no GET /api/user:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { difficultyLevel, userId = "default_user" } = await request.json();
    if (!difficultyLevel) {
      return NextResponse.json({ error: "Nível de dificuldade não fornecido" }, { status: 400 });
    }

    let prefs = await db.userPreferences.findUnique({ where: { userId } });
    if (prefs) {
      prefs = await db.userPreferences.update({
        where: { id: prefs.id },
        data: { difficultyLevel }
      });
    } else {
      prefs = await db.userPreferences.create({
        data: { userId, difficultyLevel }
      });
    }
    
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Erro no POST /api/user:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
