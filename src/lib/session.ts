import { db } from "./db";

export async function getOrCreateTodaySession(clientDate: string, userId: string) {
  // 1. Verificar se já existe uma sessão para este dia e usuário
  let session = await db.dailySession.findUnique({
    where: { userId_date: { userId, date: clientDate } },
  });

  let wordIdsList: number[] = [];

  if (session) {
    // Sessão já existe, extrai os IDs das palavras
    wordIdsList = session.wordIds
      ? session.wordIds.split(",").map(Number).filter((id) => !isNaN(id))
      : [];
  } else {
    // 2. Criar nova sessão diária com 20 palavras
    // Regra da Repetição Espaçada (Leitner System):
    const now = new Date();
    const reviewProgress = await db.userProgress.findMany({
      where: {
        userId: userId,
        nextReview: {
          lte: now,
        },
      },
      select: {
        wordId: true,
      },
      take: 20,
    });

    const dueWordIds = reviewProgress.map((p) => p.wordId);
    wordIdsList = [...dueWordIds];

    // Se não houver 20 palavras vencidas, completa com palavras novas na ordem de rank
    if (wordIdsList.length < 20) {
      let maxRank = 1000;
      const prefs = await db.userPreferences.findUnique({ where: { userId } });
      const diff = prefs?.difficultyLevel || "APRENDIZ";
      
      if (diff === "APRENDIZ") maxRank = 200;
      else if (diff === "INICIANTE") maxRank = 400;
      else if (diff === "INTERMEDIARIO") maxRank = 600;
      else if (diff === "AVANCADO") maxRank = 800;
      else if (diff === "MESTRE") maxRank = 1000;

      const needed = 20 - wordIdsList.length;
      const newWords = await db.word.findMany({
        where: {
          id: {
            notIn: wordIdsList.length > 0 ? wordIdsList : [0],
          },
          progress: {
            none: { userId }
          },
          rank: {
            lte: maxRank,
          }
        },
        orderBy: {
          rank: "asc",
        },
        select: {
          id: true,
          word: true,
        },
        take: needed * 10,
      });

      const validNew = newWords.filter(w => w.word.length > 3).slice(0, needed);
      if (validNew.length < needed) {
        validNew.push(...newWords.filter(w => w.word.length <= 3).slice(0, needed - validNew.length));
      }
      const newWordIds = validNew.map((w) => w.id);
      wordIdsList = [...wordIdsList, ...newWordIds];
    }

    // Se ainda assim não tiver palavras suficientes, pega palavras aleatórias já estudadas
    if (wordIdsList.length < 20) {
      const needed = 20 - wordIdsList.length;
      const fallbackWords = await db.word.findMany({
        where: {
          id: {
            notIn: wordIdsList.length > 0 ? wordIdsList : [0],
          },
        },
        select: {
          id: true,
          word: true,
        },
        take: needed * 5,
      });
      const validFallback = fallbackWords.filter(w => w.word.length > 3).slice(0, needed);
      if (validFallback.length < needed) {
        validFallback.push(...fallbackWords.filter(w => w.word.length <= 3).slice(0, needed - validFallback.length));
      }
      const fallbackWordIds = validFallback.map((w) => w.id);
      wordIdsList = [...wordIdsList, ...fallbackWordIds];
    }

    // Salva a nova sessão no banco de dados
    session = await db.dailySession.create({
      data: {
        userId: userId,
        date: clientDate,
        wordIds: wordIdsList.join(","),
        wordsCount: wordIdsList.length,
        completed: false,
      },
    });
  }

  // 3. Buscar os detalhes de todas as palavras da sessão
  const words = await db.word.findMany({
    where: {
      id: {
        in: wordIdsList,
      },
    },
    include: {
      progress: {
        where: { userId }
      },
    },
  });

  // Re-mapear para garantir que o array progress seja consistente
  const wordsWithUserProgress = words.map(w => ({
    ...w,
    progress: w.progress.length > 0 ? w.progress[0] : null
  }));

  const sortedWords = wordIdsList
    .map((id) => wordsWithUserProgress.find((w) => w.id === id))
    .filter((word): word is NonNullable<typeof word> => Boolean(word));

  // 4. Buscar a streak atual para retornar junto
  let streak = await db.streak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await db.streak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  }

  const prefs = await db.userPreferences.findUnique({ where: { userId } });
  const difficultyLevel = prefs?.difficultyLevel || "APRENDIZ";

  return {
    session,
    words: sortedWords,
    streak,
    difficultyLevel,
  };
}
