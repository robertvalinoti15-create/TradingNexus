import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Same Groq setup as /api/search-ai — free tier, no credit card, OpenAI-
// compatible endpoint. This route is multi-turn (full message history) and
// page-aware, for the persistent chat widget rather than one-shot search.
const MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PAGE_CONTEXT: Record<string, string> = {
  "/": "the TradingNexus home page",
  "/stocks": "the Stocks page (personal stock watchlist and portfolio)",
  "/commodities": "the Commodities page",
  "/forex": "the Forex page",
  "/crypto": "the Crypto page",
  "/indices": "the Indices page",
  "/news": "the live market news page",
  "/search": "the AI search page",
};

function systemPrompt(page?: string): string {
  const pageDesc = page ? (PAGE_CONTEXT[page] ?? `a page at ${page}`) : "the site";
  return `You are the TradingNexus Assistant, embedded as a chat widget on TradingNexus, a live multi-asset-class market tracking website (stocks, commodities, forex, crypto, and world indices, plus live news). The user is currently on ${pageDesc}. Help them understand markets, financial concepts, and how to use the site. Keep answers concise and conversational — this is a small chat widget, not a long-form article. Never give personalized investment advice (e.g. telling them to buy or sell a specific security) or predict specific future prices; you can explain concepts, summarize public information, and describe what's generally happening in the markets.`;
}

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; page?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: "Couldn't read that message. Try again." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ reply: "Ask me anything about the markets or the site." });
  }

  const apiKey =
    process.env.GROQ_API_KEY ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "groq_api_key")?.[1];

  if (!apiKey) {
    return NextResponse.json(
      { reply: "Groq is not configured yet. Add GROQ_API_KEY in Vercel to enable the chat assistant." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        // Cap history so requests stay small and cheap on the free tier.
        messages: [{ role: "system", content: systemPrompt(body.page) }, ...messages.slice(-12)],
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("chat upstream error", response.status, errBody);
      return NextResponse.json(
        { reply: `Groq request failed (HTTP ${response.status}): ${errBody.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ reply: text || "I couldn't generate a reply right now." });
  } catch (error) {
    console.error("chat error", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ reply: `I hit an issue while contacting Groq: ${message}` }, { status: 502 });
  }
}
