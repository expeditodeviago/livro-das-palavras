import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totalWords = await db.word.count();
    
    const progress = await db.userProgress.findMany();
    const studiedWords = progress.length;
    
    const masteredWords = progress.filter(p => p.box >= 5).length;
    
    let totalCorrect = 0;
    let totalIncorrect = 0;
    const boxDistribution = [0, 0, 0, 0, 0];
    progress.forEach(p => {
      totalCorrect += p.correctAttempts;
      totalIncorrect += p.incorrectAttempts;
      if (p.box >= 1 && p.box <= 5) {
        boxDistribution[p.box - 1]++;
      }
    });

    const accuracy = (totalCorrect + totalIncorrect) > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) 
      : 0;

    const streakData = await db.streak.findFirst();

    return NextResponse.json({
      totalWords,
      studiedWords,
      masteredWords,
      accuracy,
      currentStreak: streakData?.currentStreak || 0,
      longestStreak: streakData?.longestStreak || 0,
      boxDistribution
    });

  } catch (error) {
    return NextResponse.json({ error: "Falha ao carregar estatísticas" }, { status: 500 });
  }
}
