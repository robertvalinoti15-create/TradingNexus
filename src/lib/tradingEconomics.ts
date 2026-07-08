import * as cheerio from "cheerio";
import type { TEInstrument, TENewsItem } from "./teTypes";

// TradingEconomics doesn't publish a documented JSON API for this, but their
// listing pages (commodities, currencies, crypto) server-render a plain HTML
// table (no JS required) using identical markup, so one scraper covers all
// three asset classes.
const TE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const listingCache = new Map<string, { at: number; data: TEInstrument[] }>();
const CACHE_TTL_MS = 60_000;

function num(text: string | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[%,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function scrapeListing(url: string): Promise<TEInstrument[]> {
  const cached = listingCache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const res = await fetch(url, {
    headers: { "User-Agent": TE_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingEconomics fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const instruments: TEInstrument[] = [];

  $("table.table-heatmap").each((_, table) => {
    // Some tables (currencies) have a leading empty <th> for a flag-icon
    // column, so pick the first non-empty header instead of first().
    const category =
      $(table)
        .find("thead th")
        .toArray()
        .map((el) => $(el).text().trim())
        .find((text) => text.length > 0) ?? "";

    $(table)
      .find("tbody tr[data-symbol]")
      .each((_, row) => {
        const $row = $(row);
        const symbol = $row.attr("data-symbol") ?? "";
        if (!symbol) return;

        // Use the class, not positional first(): currency rows have a leading
        // flag <td> before the name cell that commodities/crypto don't have.
        const firstCell = $row.find("td.datatable-item-first");
        const path = firstCell.find("a").attr("href") ?? "";
        const name = firstCell.find("a b").text().trim() || firstCell.find("a").text().trim();
        const unit = firstCell.find("div").text().trim();

        const price = num($row.find("td#p").text());
        const dayChange = num($row.find("td#nch").text());
        const dayChangePercent = num($row.find("td#pch").text());

        const heatmapCells = $row.find("td.datatable-heatmap");
        const weeklyChangePercent = num($(heatmapCells.get(0)).text());
        const monthlyChangePercent = num($(heatmapCells.get(1)).text());
        const ytdChangePercent = num($(heatmapCells.get(2)).text());
        const yoyChangePercent = num($(heatmapCells.get(3)).text());

        const date = $row.find("td#date").text().trim() || null;

        if (!path) return;

        instruments.push({
          symbol,
          path,
          name,
          unit,
          category,
          price,
          dayChange,
          dayChangePercent,
          weeklyChangePercent,
          monthlyChangePercent,
          ytdChangePercent,
          yoyChangePercent,
          date,
        });
      });
  });

  // Currencies (and occasionally other listings) repeat the same
  // instrument across multiple category tables — e.g. EURUSD shows up
  // under both "Major" and "Europe". Keep the first occurrence only.
  const seen = new Set<string>();
  const deduped = instruments.filter((i) => {
    if (seen.has(i.path)) return false;
    seen.add(i.path);
    return true;
  });

  listingCache.set(url, { at: Date.now(), data: deduped });
  return deduped;
}

export function getCommodities(): Promise<TEInstrument[]> {
  return scrapeListing("https://tradingeconomics.com/commodities");
}

export function getCurrencies(): Promise<TEInstrument[]> {
  return scrapeListing("https://tradingeconomics.com/currencies");
}

export function getCrypto(): Promise<TEInstrument[]> {
  return scrapeListing("https://tradingeconomics.com/crypto");
}

export function getIndices(): Promise<TEInstrument[]> {
  return scrapeListing("https://tradingeconomics.com/stocks");
}

export async function getTENews(path: string): Promise<TENewsItem[]> {
  const res = await fetch(`https://tradingeconomics.com${path}`, {
    headers: { "User-Agent": TE_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingEconomics fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const items: TENewsItem[] = [];

  $(".te-stream-repeater").each((_, el) => {
    const $el = $(el);
    const link = $el.find("a").first();
    const headline = link.text().trim();
    const href = link.attr("href") ?? "";
    const description = $el.find(".comment, .te-stream-item-description").first().text().trim();
    const date = $el.find(".te-stream-date").text().trim();
    if (!headline) return;
    items.push({
      headline,
      description,
      date,
      url: href.startsWith("http") ? href : `https://tradingeconomics.com${href}`,
    });
  });

  return items.slice(0, 8);
}
