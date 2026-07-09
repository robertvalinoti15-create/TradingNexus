import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ answer: "Ask me anything about the markets, news, or site sections." });
  }

  const apiKey =
    process.env.Gemini_API_Key ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "google_ai_api_key")?.[1] ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "gemini_api_key")?.[1] ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "google_generative_ai_api_key")?.[1] ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "google_api_key")?.[1];

  if (!apiKey) {
    return NextResponse.json(
      {
        answer:
          "Google AI is not configured yet. Add one of GOOGLE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GOOGLE_API_KEY in Vercel to enable real answers for natural-language questions.",
      },
      { status: 503 }
    );
  }

  const prompt = `You are TradingNexus, a concise financial assistant. Answer the user's question about markets, stocks, crypto, commodities, forex, indices, or the site. Keep the response short, practical, and easy to scan. Do not give personalized investment advice.\n\nUser question: ${query}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI request failed: ${response.status}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({ answer: text || "I couldn't generate an answer right now." });
  } catch (error) {
    console.error("search-ai error", error);
    return NextResponse.json(
      {
        answer:
          "I hit a temporary issue while contacting Google AI. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
