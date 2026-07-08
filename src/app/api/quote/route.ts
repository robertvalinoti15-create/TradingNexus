import { NextRequest, NextResponse } from "next/server";
import type { Exchange, Quote } from "@/lib/types";

export const dynamic = "force-dynamic";

// Yahoo's fullExchangeName is much finer-grained than the NYSE/NASDAQ/AMEX
// split TradingView symbols need (e.g. "NasdaqGS", "NasdaqGM", "NasdaqCM").
function toExchange(fullExchangeName: string | undefined): Exchange | null {
  if (!fullExchangeName) return null;
  const n = fullExchangeName.toLowerCase();
  if (n.startsWith("nasdaq")) return "NASDAQ";
  if (n === "nyse") return "NYSE";
  if (n === "nyse american") return "AMEX";
  return null;
}

async function fetchQuote(symbol: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=1mo`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (stock-tracker personal app)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstream status ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No data for symbol");

    const meta = result.meta ?? {};
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? [];
    const cleanCloses = closes.filter((c) => typeof c === "number");
    const price: number | null = meta.regularMarketPrice ?? null;
    const previousClose: number | null =
      cleanCloses.length >= 2 ? cleanCloses[cleanCloses.length - 2] : meta.chartPreviousClose ?? null;

    const change = price !== null && previousClose !== null ? price - previousClose : null;
    const changePercent =
      change !== null && previousClose ? (change / previousClose) * 100 : null;

    // Average volume over the trading days prior to today, used as a baseline
    // for flagging elevated ("unusual") trading activity.
    const priorVolumes = volumes.filter((v) => typeof v === "number").slice(0, -1);
    const avgVolume =
      priorVolumes.length > 0
        ? priorVolumes.reduce((sum, v) => sum + v, 0) / priorVolumes.length
        : null;

    return {
      symbol,
      name: meta.longName ?? meta.shortName ?? null,
      price,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? null,
      avgVolume,
      marketCap: null,
      currency: meta.currency ?? null,
      exchange: toExchange(meta.fullExchangeName),
    };
  } catch (err) {
    return {
      symbol,
      name: null,
      price: null,
      previousClose: null,
      change: null,
      changePercent: null,
      volume: null,
      avgVolume: null,
      marketCap: null,
      currency: null,
      exchange: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const quotes = await Promise.all(symbols.map(fetchQuote));
  return NextResponse.json({ quotes });
}
