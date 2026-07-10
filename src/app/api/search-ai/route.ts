import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Groq's free tier needs no credit card and has usable limits (30 req/min,
// 1,000 req/day on this model) — a better fit for a personal app than
// Gemini's free tier, which this replaced after repeatedly hitting a 429
// quota error. Groq's API is OpenAI-compatible.
const MODEL = "llama-3.3-70b-versatile";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ answer: "Ask me anything about the markets, news, or site sections." });
  }

  const apiKey =
    process.env.GROQ_API_KEY ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "groq_api_key")?.[1];

  if (!apiKey) {
    return NextResponse.json(
      {
        answer: "Groq is not configured yet. Add GROQ_API_KEY in Vercel to enable real answers for natural-language questions.",
      },
      { status: 503 }
    );
  }

  const prompt = `You are TradingNexus, a concise financial assistant. Answer the user's question about markets, stocks, crypto, commodities, forex, indices, or this site. Keep your response practical, short, and scannable. Do not give personalized investment advice.

Use exactly this structure:
Summary:
- One sentence

Key drivers:
- 2 to 4 bullet points

Risks:
- 1 to 3 bullet points

What to watch next:
- 2 to 3 bullet points

Do not include markdown bold, code fences, or disclaimers beyond "Not investment advice." as a final short line.

User question: ${query}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("search-ai upstream error", response.status, body);
      return NextResponse.json(
        {
          answer: `Groq request failed (HTTP ${response.status}): ${body.slice(0, 300)}`,
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({ answer: text || "I couldn't generate an answer right now." });
  } catch (error) {
    console.error("search-ai error", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        answer: `I hit an issue while contacting Groq: ${message}`,
      },
      { status: 502 }
    );
  }
}
