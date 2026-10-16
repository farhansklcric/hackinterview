
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing from .env.local." },
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
        { error: "Please provide a question." },
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

    const result = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: `You are a helpful interview practice coach.

Help the user prepare for an interview in a mock or otherwise
authorized practice session.

Question:
${question}

Instructions:
- Give a clear, accurate, useful sample answer.
- Start with the main point, then explain it with relevant details.
- For technical questions, include the key concepts and a simple example
  when helpful.
- For behavioral questions, provide a natural sample response and
  do not invent personal experiences or achievements for the user.
- Use concise language that is easy to understand and practice aloud.
- If the question is ambiguous, state your assumption.
- Do not claim the user has experience or qualifications that were
  not provided.

Return the suggested answer only.`,
    });

    const answer = result.output_text?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "The AI returned an empty answer. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Answer generation failed:", error);

    return NextResponse.json(
      { error: "Could not generate an answer. Please try again." },
      { status: 500 }
    );
  }
}
