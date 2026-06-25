import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { message, wrongWords } = await req.json();

    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "A mensagem é muito longa para o Oráculo compreender." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "A conexão mística com o Oráculo foi rompida. Verifique os selos." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemInstruction = `
      Você é 'O Oráculo', um experiente e sábio professor de inglês aprisionado em um grimório mágico.
      Abaixo estão as palavras de inglês que o usuário errou no treino de hoje:
      Erros de hoje: ${wrongWords.length > 0 ? wrongWords.join(", ") : "Nenhuma! Ele acertou 100%!"}

      REGRAS CRÍTICAS:
      1. Se o usuário NÃO errou nenhuma palavra (lista vazia), APENAS dê os parabéns pelo desempenho perfeito e se ofereça para tirar qualquer dúvida livre de inglês. NÃO corrija a forma como ele escreve em português (ex: abreviações como "hj", "vc").
      2. Se ele errou palavras, SEJA DIRETO, PRÁTICO e ÚTIL. Explique o que a palavra significa, a gramática envolvida, ou dicas de como não esquecer, dando exemplos reais em inglês.
      3. Evite metáforas vagas que não ensinam nada. Você pode manter um pequeno toque de sabedoria ancestral no início ("Ah, jovem aprendiz..."), mas o resto deve ser foco 100% no ensino do inglês.
      4. Responda em português de forma concisa, no máximo 1 ou 2 parágrafos curtos.
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "assistant", content: "Compreendo meu papel. Sou o Oráculo do Grimório. Mostre-me as dúvidas do jovem aprendiz." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const responseText = completion.choices[0].message.content;

    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error("Erro na API do Oráculo:", error);
    return NextResponse.json(
      { error: "As magias falharam. Não consegui contatar o Oráculo." },
      { status: 500 }
    );
  }
}

