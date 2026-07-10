import * as cheerio from "cheerio";

// TradingEconomics' calendar page server-renders every scheduled release for
// every country in one HTML table (300+ rows/day) with no importance/impact
// signal in the static markup — that data is painted in client-side. So
// instead of trying to replicate their impact scoring, this scopes down to
// the handful of countries and release categories that actually move
// cross-asset desks, which keeps the list short without guessing at
// relevance.
const TE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const MAJOR_COUNTRIES = new Set([
  "united states",
  "euro area",
  "united kingdom",
  "japan",
  "china",
  "germany",
  "canada",
]);

const HIGH_IMPACT_KEYWORDS = [
  "interest rate",
  "fomc",
  "inflation rate",
  "cpi",
  "core inflation",
  "gdp growth rate",
  "gdp mom",
  "gdp yoy",
  "non farm payrolls",
  "nonfarm payrolls",
  "unemployment rate",
  "retail sales",
  "ism manufacturing",
  "ism services",
  "manufacturing pmi",
  "services pmi",
  "composite pmi",
  "jobless claims",
  "ppi",
  "producer price",
  "pce price index",
  "consumer confidence",
  "durable goods",
  "trade balance",
  "housing starts",
  "building permits",
  "industrial production",
  "business confidence",
];

export interface EconomicEvent {
  id: string;
  dateTime: string; // ISO 8601
  country: string;
  countryCode: string;
  event: string;
  period?: string;
  actual?: string;
  previous?: string;
  consensus?: string;
  sentiment: "positive" | "negative" | "neutral";
  url: string;
}

const cache = { at: 0, data: [] as EconomicEvent[] };
const CACHE_TTL_MS = 3 * 60_000;

function isHighImpact(category: string): boolean {
  return HIGH_IMPACT_KEYWORDS.some((keyword) => category.includes(keyword));
}

function toSentiment(className: string | undefined): EconomicEvent["sentiment"] {
  if (!className) return "neutral";
  if (className.includes("calendar-item-positive")) return "positive";
  if (className.includes("calendar-item-negative")) return "negative";
  return "neutral";
}

export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  if (cache.data.length > 0 && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const res = await fetch("https://tradingeconomics.com/calendar", {
    headers: { "User-Agent": TE_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingEconomics fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const events: EconomicEvent[] = [];

  $("#calendar tr[data-url]").each((_, row) => {
    const $row = $(row);
    const country = ($row.attr("data-country") ?? "").trim();
    const category = ($row.attr("data-category") ?? "").trim();
    if (!MAJOR_COUNTRIES.has(country) || !isHighImpact(category)) return;

    const id = $row.attr("data-id") ?? "";
    const url = $row.attr("data-url") ?? "";
    if (!id || !url) return;

    let dateStr: string | undefined;
    let dateCell: ReturnType<typeof $row.find> | undefined;
    $row.find("td").each((_, td) => {
      const cls = ($(td).attr("class") ?? "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cls)) {
        dateStr = cls;
        dateCell = $(td);
        return false;
      }
    });
    if (!dateStr || !dateCell) return;

    const time = dateCell.find("span").text().trim();
    const parsedTime = new Date(`${dateStr} ${time || "00:00"} UTC`);
    const dateTime = Number.isNaN(parsedTime.getTime()) ? `${dateStr}T00:00:00Z` : parsedTime.toISOString();

    const countryCode = $row.find(".calendar-iso").first().text().trim();
    const event = $row.find("a.calendar-event").first().text().trim();
    const period = $row.find(".calendar-reference").first().text().trim() || undefined;
    if (!event) return;

    const actualSpan = $row.find("#actual").first();
    const actual = actualSpan.text().trim() || undefined;
    const previous = $row.find("#previous").first().text().trim() || undefined;
    const consensus = $row.find("#consensus").first().text().trim() || undefined;
    // The country/flag cell is also class="calendar-item" but carries no
    // sentiment suffix — target the actual-value cell specifically.
    const sentimentClass = actualSpan.closest("td").attr("class");

    events.push({
      id,
      dateTime,
      country,
      countryCode,
      event,
      period,
      actual,
      previous,
      consensus,
      sentiment: toSentiment(sentimentClass),
      url: url.startsWith("http") ? url : `https://tradingeconomics.com${url}`,
    });
  });

  events.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  cache.at = Date.now();
  cache.data = events;
  return events;
}
