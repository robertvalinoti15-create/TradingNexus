import * as cheerio from "cheerio";
import type { NewsItem } from "./newsTypes";

// Google News' RSS search has no documented API or key requirement — it's
// the same feed format available at news.google.com/rss/search. It
// aggregates real outlets (Reuters, Bloomberg, CNBC, MarketWatch, etc.),
// which is what makes it useful as a second/third provider alongside
// TradingEconomics' own wire instead of relying on a single source.
const GN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const cache = new Map<string, { at: number; data: NewsItem[] }>();
const CACHE_TTL_MS = 60_000;

export async function getGoogleNews(query: string): Promise<NewsItem[]> {
  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: { "User-Agent": GN_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google News fetch failed: ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const items: NewsItem[] = [];

  $("item").each((_, el) => {
    const $el = $(el);
    const source = $el.find("source").first().text().trim() || "Google News";

    // Title comes as "Headline - Source"; strip the redundant suffix since
    // the source tag already gives us the publisher name cleanly.
    let headline = $el.find("title").first().text().trim();
    const suffix = ` - ${source}`;
    if (headline.endsWith(suffix)) headline = headline.slice(0, -suffix.length);

    const link = $el.find("link").first().text().trim();
    const pubDate = $el.find("pubDate").first().text().trim();
    const parsed = pubDate ? new Date(pubDate) : null;
    const publishedAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();

    if (!headline || !link) return;

    items.push({
      headline,
      url: link,
      source,
      provider: "Google News",
      publishedAt,
    });
  });

  const limited = items.slice(0, 10);
  cache.set(query, { at: Date.now(), data: limited });
  return limited;
}
