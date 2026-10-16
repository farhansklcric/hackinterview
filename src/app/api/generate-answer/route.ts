
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in Vercel environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        { error: "Please provide an interview question." },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { error: "The question is too long." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a helpful interview practice coach.

Provide a sample answer for this interview practice question:

${question}

Instructions:
- Answer clearly and naturally.
- For technical questions, explain the key concepts and give a simple example when useful.
- For behavioral questions, provide a sample response without inventing the user's personal experiences.
- Keep the answer concise and easy to speak aloud.
- Do not include unnecessary introductions.
- Return only the suggested answer.
`;

    let lastError: unknown;

    for (const model of MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.5,
            maxOutputTokens: 500,
          },
        });

        const answer = result.text?.trim();

        if (answer) {
          return NextResponse.json({ answer });
        }

        lastError = new Error("The model returned an empty answer.");
      } catch (error) {
        lastError = error;
        console.error(`Gemini model ${model} failed:`, error);
      }
    }

    console.error("All Gemini models failed:", lastError);

    return NextResponse.json(
      {
        error:
          "Gemini is temporarily unavailable or your API quota has been reached. Please try again shortly.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Answer generation failed:", error);

    return NextResponse.json(
      { error: "Could not generate an answer. Please try again." },
      { status: 500 }
    );
  }
}
