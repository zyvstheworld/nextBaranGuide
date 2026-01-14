import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY missing");
      return NextResponse.json(
        { error: "Server misconfiguration: missing Gemini API key" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid text input" },
        { status: 400 }
      );
    }

    const prompt = `
Extract FAQs from the following text.

STRICT FORMAT:
Q: question
A: answer

One FAQ per block.

TEXT:
${text}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("❌ Gemini error:", err);
      return NextResponse.json(
        { error: "Gemini API error", details: err },
        { status: 500 }
      );
    }

    const data = await geminiRes.json();
    const response =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response) {
      return NextResponse.json(
        { error: "Empty Gemini response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error("❌ Route crash:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
