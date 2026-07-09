import { NextRequest, NextResponse } from "next/server";
import { getGoogleNews } from "@/lib/googleNews";
import { getTENews } from "@/lib/tradingEconomics";
import type { NewsItem } from "@/lib/newsTypes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const tePath = req.nextUrl.searchParams.get("tePath");

  const [googleResult, teResult] = await Promise.allSettled([
    query ? getGoogleNews(query) : Promise.resolve([]),
    tePath ? getTENews(tePath) : Promise.resolve([]),
  ]);

  const items: NewsItem[] = [];

  if (googleResult.status === "fulfilled") {
    items.push(...googleResult.value);
  }

  if (teResult.status === "fulfilled") {
    for (const t of teResult.value) {
      const parsed = new Date(t.date);
      items.push({
        headline: t.headline,
        url: t.url,
        source: "TradingEconomics",
        provider: "TradingEconomics",
        publishedAt: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
        description: t.description,
      });
    }
  }

  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json({ items });
}
