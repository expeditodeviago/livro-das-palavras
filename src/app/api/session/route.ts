import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateTodaySession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Helper para obter a data no formato YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientDate = searchParams.get("date") || getLocalDateString();
    const userId = searchParams.get("userId") || "default_user";

    const data = await getOrCreateTodaySession(clientDate, userId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no GET /api/session:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, timeSpent, score, wordResults, userId = "default_user" } = body;
    // wordResults é um objeto do tipo: { [wordId: number]: boolean } (true = correto, false = incorreto)

    if (!date || !wordResults) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // 1. Buscar a sessão diária
    const session = await db.dailySession.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada para a data informada" },
        { status: 404 }
      );
    }

    if (session.completed) {
      return NextResponse.json(
        { error: "Sessão já completada hoje" },
        { status: 400 }
      );
    }

    // 2. Atualizar o progresso de cada palavra praticada (Leitner System)
    const now = new Date();
    const resultsArray = Object.entries(wordResults) as [string, boolean][];

    for (const [wordIdStr, isCorrect] of resultsArray) {
      const wordId = parseInt(wordIdStr, 10);
      if (isNaN(wordId)) continue;

      const progress = await db.userProgress.findUnique({
        where: { userId_wordId: { userId, wordId } },
      });

      if (progress) {
        // Atualiza progresso existente
        if (isCorrect) {
          const nextBox = Math.min(progress.box + 1, 5);
          const nextReview = calculateNextReview(nextBox, now);

          await db.userProgress.update({
            where: { userId_wordId: { userId, wordId } },
            data: {
              box: nextBox,
              streak: progress.streak + 1,
              correctAttempts: progress.correctAttempts + 1,
              nextReview,
            },
          });
        } else {
          // Errou: volta para a caixa 1 e agenda revisão para amanhã (ou 1 dia)
          const nextReview = calculateNextReview(1, now);

          await db.userProgress.update({
            where: { userId_wordId: { userId, wordId } },
            data: {
              box: 1,
              streak: 0,
              incorrectAttempts: progress.incorrectAttempts + 1,
              nextReview,
            },
          });
        }
      } else {
        // Cria novo progresso
        if (isCorrect) {
          const nextReview = calculateNextReview(2, now); // Avança para caixa 2
          await db.userProgress.create({
            data: {
              userId,
              wordId,
              box: 2,
              streak: 1,
              correctAttempts: 1,
              incorrectAttempts: 0,
              nextReview,
            },
          });
        } else {
          const nextReview = calculateNextReview(1, now); // Fica na caixa 1
          await db.userProgress.create({
            data: {
              userId,
              wordId,
              box: 1,
              streak: 0,
              correctAttempts: 0,
              incorrectAttempts: 1,
              nextReview,
            },
          });
        }
      }
    }

    // 3. Atualizar a sessão diária como completa
    const updatedSession = await db.dailySession.update({
      where: { userId_date: { userId, date } },
      data: {
        completed: true,
        completedAt: now,
        score,
        timeSpent,
      },
    });

    // 4. Atualizar o Streak do usuário
    let streak = await db.streak.findUnique({ where: { userId } });
    if (!streak) {
      streak = await db.streak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: date },
      });
    } else {
      const lastActive = streak.lastActiveDate;
      let newCurrentStreak = streak.currentStreak;

      if (lastActive === date) {
        // Já jogou hoje, não altera o streak
      } else if (isYesterday(lastActive, date)) {
        // Jogou ontem e hoje: incrementa streak
        newCurrentStreak += 1;
      } else {
        // Quebrou o streak: reseta para 1
        newCurrentStreak = 1;
      }

      const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

      streak = await db.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: date,
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      streak,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no POST /api/session:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: message },
      { status: 500 }
    );
  }
}

// Calcula a próxima revisão baseado na Caixa do Leitner System
function calculateNextReview(box: number, now: Date): Date {
  const result = new Date(now);
  switch (box) {
    case 1:
      result.setDate(result.getDate() + 1); // 1 dia
      break;
    case 2:
      result.setDate(result.getDate() + 3); // 3 dias
      break;
    case 3:
      result.setDate(result.getDate() + 7); // 7 dias
      break;
    case 4:
      result.setDate(result.getDate() + 14); // 14 dias
      break;
    case 5:
      result.setDate(result.getDate() + 30); // 30 dias
      break;
    default:
      result.setDate(result.getDate() + 1);
  }
  return result;
}

// Verifica se dateStr1 é o dia imediatamente anterior a dateStr2 (formato YYYY-MM-DD)
function isYesterday(dateStr1: string | null, dateStr2: string): boolean {
  if (!dateStr1) return false;
  try {
    const d1 = new Date(dateStr1 + "T00:00:00");
    const d2 = new Date(dateStr2 + "T00:00:00");

    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 1;
  } catch {
    return false;
  }
}
