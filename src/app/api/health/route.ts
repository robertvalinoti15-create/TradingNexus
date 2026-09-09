import { NextResponse } from "next/server";
import { GROQ_MODEL } from "@/lib/aiModel";
import { GN_UA } from "@/lib/googleNews";
import { TE_UA } from "@/lib/tradingEconomics";
import { SEC_UA } from "@/lib/sec";

export const dynamic = "force-dynamic";

// One endpoint that pings every third-party feed the site depends on, so a
// silent upstream break is visible from a single URL instead of only
// surfacing when someone happens to open the page it broke.
//
// Two rules make this actually useful:
//   1. Each check sends the SAME headers the real caller sends. ESPN began
//      403ing our spoofed Chrome User-Agent while a plain request still
//      worked — a check with different headers would have reported healthy.
//   2. Each check validates the response body, not just the status code.
//      These are scraped HTML pages and undocumented JSON endpoints; they
//      return 200 with the wrong shape when they change.

const TIMEOUT_MS = 8000;

type Status = "ok" | "degraded" | "down";

interface Check {
  name: string;
  powers: string;
  status: Status;
  detail: string;
  ms: number;
}

async function check(
  name: string,
  powers: string,
  run: () => Promise<{ status: Status; detail: string }>
): Promise<Check> {
  const startedAt = Date.now();
  try {
    const result = await run();
    return { name, powers, ...result, ms: Date.now() - startedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      powers,
      status: "down",
      detail: message.includes("timeout") || message.includes("aborted") ? `No response in ${TIMEOUT_MS}ms` : message,
      ms: Date.now() - startedAt,
    };
  }
}

function get(url: string, headers?: Record<string, string>) {
  return fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function checkEspn() {
  // No User-Agent — matches sportsScores.ts. Adding one gets a 403.
  const res = await get("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard");
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const json = (await res.json()) as { events?: unknown[] };
  if (!Array.isArray(json.events)) {
    return { status: "down" as const, detail: "200 but no `events` array — response shape changed" };
  }
  return { status: "ok" as const, detail: `${json.events.length} MLB events` };
}

async function checkGroq() {
  const apiKey =
    process.env.GROQ_API_KEY ??
    Object.entries(process.env).find(([key]) => key.toLowerCase() === "groq_api_key")?.[1];
  if (!apiKey) return { status: "down" as const, detail: "GROQ_API_KEY is not set" };

  const res = await get("https://api.groq.com/openai/v1/models", { Authorization: `Bearer ${apiKey}` });
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status} — key rejected or API down` };

  // The check that would have caught the llama-3.3-70b retirement: confirm
  // the model the AI routes actually name is still being served.
  const json = (await res.json()) as { data?: { id?: string }[] };
  const models = (json.data ?? []).map((m) => m.id).filter(Boolean);
  if (!models.includes(GROQ_MODEL)) {
    return {
      status: "down" as const,
      detail: `Model "${GROQ_MODEL}" is no longer offered — chat and AI search will 404 until it is changed`,
    };
  }
  return { status: "ok" as const, detail: `Model "${GROQ_MODEL}" available` };
}

async function checkGoogleNews() {
  const res = await get(
    "https://news.google.com/rss/search?q=markets&hl=en-US&gl=US&ceid=US:en",
    { "User-Agent": GN_UA }
  );
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const xml = await res.text();
  const items = (xml.match(/<item>/g) ?? []).length;
  if (items === 0) return { status: "down" as const, detail: "200 but feed had no <item> entries" };
  return { status: "ok" as const, detail: `${items} headlines` };
}

async function checkTradingEconomics() {
  const res = await get("https://tradingeconomics.com/commodities", { "User-Agent": TE_UA });
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const html = await res.text();
  // The scraper keys off this table class; losing it breaks every TE page.
  if (!html.includes("table-heatmap")) {
    return { status: "down" as const, detail: "200 but no `table-heatmap` markup — scraper selectors are stale" };
  }
  const rows = (html.match(/data-symbol="/g) ?? []).length;
  return { status: "ok" as const, detail: `${rows} instrument rows` };
}

async function checkYahoo() {
  const res = await get("https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d", {
    "User-Agent": "Mozilla/5.0 (stock-tracker personal app)",
  });
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const json = (await res.json()) as { chart?: { result?: { meta?: { regularMarketPrice?: number } }[] } };
  const price = json.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== "number") {
    return { status: "down" as const, detail: "200 but no price in payload — response shape changed" };
  }
  return { status: "ok" as const, detail: `AAPL ${price}` };
}

async function checkSec() {
  const res = await get("https://www.sec.gov/files/company_tickers.json", { "User-Agent": SEC_UA });
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const json = (await res.json()) as Record<string, unknown>;
  const count = Object.keys(json).length;
  if (count === 0) return { status: "down" as const, detail: "200 but empty ticker map" };
  return { status: "ok" as const, detail: `${count} tickers mapped` };
}

async function checkWikipedia() {
  const res = await get("https://en.wikipedia.org/api/rest_v1/page/summary/Gold");
  if (!res.ok) return { status: "down" as const, detail: `HTTP ${res.status}` };
  const json = (await res.json()) as { extract?: string };
  if (!json.extract) return { status: "down" as const, detail: "200 but no summary text" };
  return { status: "ok" as const, detail: "Summaries returning" };
}

export async function GET() {
  const checks = await Promise.all([
    check("ESPN", "Sports scores and schedules", checkEspn),
    check("Groq", "AI chat widget and AI search", checkGroq),
    check("Google News", "News pages and per-instrument headlines", checkGoogleNews),
    check("TradingEconomics", "Commodities, Forex, Crypto, Indices, Bonds", checkTradingEconomics),
    check("Yahoo Finance", "Stock quotes, watchlist, portfolio P&L", checkYahoo),
    check("SEC EDGAR", "Insider and institutional filings", checkSec),
    check("Wikipedia", "Instrument 'About' explanations", checkWikipedia),
  ]);

  const down = checks.filter((c) => c.status === "down");
  const status: Status = down.length === 0 ? "ok" : down.length === checks.length ? "down" : "degraded";

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      summary:
        down.length === 0
          ? `All ${checks.length} upstreams healthy`
          : `${down.length} of ${checks.length} failing: ${down.map((c) => c.name).join(", ")}`,
      checks,
    },
    // 200 even when degraded: this is a report, and a non-2xx would make
    // uptime pingers flag the site itself as down rather than one feed.
    { status: 200 }
  );
}
