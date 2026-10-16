
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    const prompt = `
You are an expert interview practice coach.

Answer this interview question:
${question}

Instructions:
- Give a technically accurate and clear answer.
- For coding questions, explain the approach, complexity, and code when useful.
- For conceptual questions, explain the core idea and give an example.
- For behavioral questions, do not invent the user's personal experiences.
- Keep the answer concise, structured, and easy to speak aloud.
- Return only the suggested answer.
`;

    // Try Groq first.
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        timeout: 7000,
        maxRetries: 0,
});
        const result = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You are a precise, helpful technical interview coach.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 450,
        });

        const answer =
          result.choices[0]?.message?.content?.trim();

        if (answer) {
          return NextResponse.json({
            answer,
            provider: "groq",
          });
        }
      } catch (error) {
        console.error("Groq request failed:", error);
      }
    }

    // Fall back to Gemini if Groq fails.
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const result = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const answer = result.text?.trim();

        if (answer) {
          return NextResponse.json({
            answer,
            provider: "gemini",
          });
        }
      } catch (error) {
        console.error("Gemini fallback failed:", error);
      }
    }

    return NextResponse.json(
      {
        error:
          "Both AI providers failed. Please try again shortly.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Answer generation failed:", error);

    return NextResponse.json(
      { error: "Could not generate an answer." },
      { status: 500 }
    );
  }
}
