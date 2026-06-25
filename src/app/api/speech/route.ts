import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Usando o modelo whisper da groq para transcrição ultra rápida
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: error.message },
      { status: 500 }
    );
  }
}
