// Shared helpers for talking to SEC EDGAR. SEC requires a descriptive
// User-Agent identifying the app + contact per their fair-access policy:
// https://www.sec.gov/os/webmaster-faq#developers
export const SEC_UA = "personal-stock-tracker robertvalinoti15@gmail.com";

let tickerCikCache: Map<string, { cik: string; title: string }> | null = null;
let tickerCikCacheAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h, this file changes rarely

export async function getCikForSymbol(
  symbol: string
): Promise<{ cik: string; title: string } | null> {
  const now = Date.now();
  if (!tickerCikCache || now - tickerCikCacheAt > CACHE_TTL_MS) {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": SEC_UA },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`SEC ticker map fetch failed: ${res.status}`);
    const data: Record<string, { cik_str: number; ticker: string; title: string }> =
      await res.json();
    const map = new Map<string, { cik: string; title: string }>();
    for (const entry of Object.values(data)) {
      map.set(entry.ticker.toUpperCase(), {
        cik: String(entry.cik_str).padStart(10, "0"),
        title: entry.title,
      });
    }
    tickerCikCache = map;
    tickerCikCacheAt = now;
  }
  return tickerCikCache.get(symbol.toUpperCase()) ?? null;
}
