import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    // Busca palavras onde o usuário já errou, ordenadas por mais erros
    const userProgress = await db.userProgress.findMany({
      where: {
        userId: userId,
        incorrectAttempts: { gt: 0 }
      },
      orderBy: [
        { incorrectAttempts: "desc" },
        { nextReview: "asc" }
      ],
      take: 20,
      include: { word: true }
    });

    let wordsToReview = userProgress.map(p => p.word);

    // Se não houver palavras com erros, pega palavras que precisam de revisão (baseado na data)
    if (wordsToReview.length < 20) {
      const needed = 20 - wordsToReview.length;
      const additionalProgress = await db.userProgress.findMany({
        where: {
          userId: userId,
          incorrectAttempts: 0,
          nextReview: { lte: new Date() }
        },
        orderBy: { nextReview: "asc" },
        take: needed * 5,
        include: { word: true }
      });
      
      const extraWords = additionalProgress.map(p => p.word).filter(w => !wordsToReview.some(ew => ew.id === w.id));
      const validExtra = extraWords.filter(w => w.word.length > 3).slice(0, needed);
      if (validExtra.length < needed) validExtra.push(...extraWords.filter(w => w.word.length <= 3).slice(0, needed - validExtra.length));
      
      wordsToReview = [...wordsToReview, ...validExtra];
    }

    // Se ainda assim faltar, pega palavras aleatórias já estudadas
    if (wordsToReview.length < 20) {
      const needed = 20 - wordsToReview.length;
      const fallbackProgress = await db.userProgress.findMany({
        where: { userId: userId },
        take: needed * 5,
        include: { word: true }
      });
      const fallbackWords = fallbackProgress.map(p => p.word).filter(w => !wordsToReview.some(ew => ew.id === w.id));
      const validFallback = fallbackWords.filter(w => w.word.length > 3).slice(0, needed);
      if (validFallback.length < needed) validFallback.push(...fallbackWords.filter(w => w.word.length <= 3).slice(0, needed - validFallback.length));
      
      wordsToReview = [...wordsToReview, ...validFallback];
    }
    
    // Se ainda assim faltar (banco de dados vazio de progresso), pega palavras não estudadas
    if (wordsToReview.length < 20) {
        const needed = 20 - wordsToReview.length;
        const newWords = await db.word.findMany({
            where: { id: { notIn: wordsToReview.length > 0 ? wordsToReview.map(w => w.id) : [0] } },
            take: needed * 5
        });
        const validNew = newWords.filter(w => w.word.length > 3).slice(0, needed);
        if (validNew.length < needed) validNew.push(...newWords.filter(w => w.word.length <= 3).slice(0, needed - validNew.length));
        
        wordsToReview = [...wordsToReview, ...validNew];
    }

    // Buscar as configurações de dificuldade do usuário
    const prefs = await db.userPreferences.findUnique({ where: { userId } });
    const difficultyLevel = prefs?.difficultyLevel || "APRENDIZ";

    // Embaralhar as palavras para o modo treino
    const shuffled = wordsToReview.sort(() => 0.5 - Math.random());

    return NextResponse.json({ words: shuffled, difficultyLevel });
  } catch (error) {
    console.error("Erro ao gerar sessão de revisão:", error);
    return NextResponse.json(
      { error: "Falha ao gerar treino extra" },
      { status: 500 }
    );
  }
}
