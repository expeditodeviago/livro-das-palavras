import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { words } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "API Key do Groq não encontrada." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemInstruction = `
      Você é um gerador de exercícios de "Reading Comprehension" em inglês para alunos avançados/fluentes.
      Crie um poema muito curto (2-3 estrofes) ou um pequeno conto misterioso em inglês (máx 3 parágrafos).
      O texto deve conter pelo menos 2 destas palavras (se possível): ${words.join(", ")}.
      No final, gere UMA pergunta de interpretação sobre a história, com 4 opções de resposta (A, B, C, D).
      Retorne o resultado estritamente neste formato JSON:
      {
        "text": "O poema ou conto em inglês aqui com quebras de linha...",
        "question": "A pergunta em inglês...",
        "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
        "correctOptionIndex": 2 // índice da opção correta (0 a 3)
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: "Gere o exercício agora, retornando apenas o JSON válido, sem markdown adicional em volta." }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    let responseText = completion.choices[0].message.content || "";
    // Limpar o markdown caso o modelo insista em colocar ```json
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return NextResponse.json(JSON.parse(responseText));

  } catch (error) {
    console.error("Erro na API de Reading:", error);
    return NextResponse.json(
      { error: "Erro ao gerar texto de interpretação." },
      { status: 500 }
    );
  }
}
