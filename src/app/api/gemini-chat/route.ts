import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Fetch FAQs and Services
    const [{ data: faqs }, { data: services }] = await Promise.all([
      supabase.from("faqs").select("question, answer"),
      supabase.from("services").select("title, description, price, duration"),
    ]);

    // Build prompt
    let prompt = `You are a helpful barangay assistant. Answer the user's question using only the following FAQs and services. If you don't know the answer, say you don't know and suggest contacting the barangay office.\n\n`;
    prompt += `FAQs:\n`;
    if (faqs && faqs.length > 0) {
      faqs.forEach((faq, i) => {
        prompt += `${i + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
      });
    } else {
      prompt += "No FAQs available.\n";
    }
    prompt += `\nServices:\n`;
    if (services && services.length > 0) {
      services.forEach((service, i) => {
        prompt += `${i + 1}. ${service.title}: ${service.description} (Price: ₱${service.price}, Duration: ${service.duration})\n`;
      });
    } else {
      prompt += "No services available.\n";
    }
    prompt += `\nUser's question: ${question}\n\nAnswer as helpfully and concisely as possible.`;

    // Call Gemini Flash 2.0
    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
      }),
    });
    const geminiData = await geminiRes.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get an answer from Gemini.";
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ error: "Server error: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
} 