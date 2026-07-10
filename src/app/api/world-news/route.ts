import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getGoogleNews } from "@/lib/googleNews";
import type { NewsItem } from "@/lib/newsTypes";

export const dynamic = "force-dynamic";

const DEFAULT_QUERY = "world news";
const FALLBACK_QUERIES = ["world news", "geopolitics", "international news"];
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function isGoogleNewsHost(hostname: string): boolean {
  return hostname === "news.google.com" || hostname.endsWith(".news.google.com");
}

function isHttpUrl(raw: string): boolean {
  return raw.startsWith("http://") || raw.startsWith("https://");
}

function sanitizeCandidateUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!isHttpUrl(trimmed)) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (isGoogleNewsHost(parsed.hostname)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function decodeGoogleNewsToken(token: string): string | undefined {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const matches = decoded.match(/https?:\/\/[^\s\x00-\x1F\"'<>()]+/g);
    if (!matches) return undefined;

    for (const candidate of matches) {
      const cleaned = candidate
        .replace(/\\u003d/g, "=")
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/")
        .replace(/[\])}>,.;:!?]+$/, "");
      const safe = sanitizeCandidateUrl(cleaned);
      if (safe) return safe;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function decodeGoogleNewsUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!isGoogleNewsHost(parsed.hostname)) return undefined;

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const articlesIndex = pathSegments.findIndex((segment) => segment === "articles");
    const token = articlesIndex >= 0 ? pathSegments[articlesIndex + 1] : undefined;
    if (token) {
      const decoded = decodeGoogleNewsToken(token);
      if (decoded) return decoded;
    }

    const fromQuery =
      sanitizeCandidateUrl(parsed.searchParams.get("url") || undefined) ||
      sanitizeCandidateUrl(parsed.searchParams.get("u") || undefined);
    if (fromQuery) return fromQuery;
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeImageUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

function normalizeText(raw?: string): string {
  return (raw ?? "").replace(/\s+/g, " ").trim();
}

function isLowQualityArticleText(text?: string): boolean {
  if (!text) return true;
  const t = text.toLowerCase();
  if (t.length < 120) return true;
  if (t.includes("comprehensive up-to-date news coverage, aggregated from sources all over the world by google news")) {
    return true;
  }
  return false;
}

function extractArticleText($: cheerio.CheerioAPI): string | undefined {
  const candidates = [
    "article p",
    "main p",
    "[role='main'] p",
    ".article-body p",
    ".story-body p",
    "p",
  ];

  for (const selector of candidates) {
    const paragraphs = $(selector)
      .toArray()
      .map((el) => normalizeText($(el).text()))
      .filter((text) => text.length > 30 && text.length < 1200)
      .slice(0, 12);

    if (paragraphs.length >= 3 || (paragraphs.length >= 1 && paragraphs.join(" ").length >= 350)) {
      return paragraphs.join("\n\n").slice(0, 8000);
    }
  }

  return undefined;
}

function getCanonicalPublisherUrl($: cheerio.CheerioAPI): string | undefined {
  const ogUrl = normalizeText($("meta[property='og:url']").attr("content"));
  const canonical = normalizeText($("link[rel='canonical']").attr("href"));
  const candidate = ogUrl || canonical;
  if (!candidate) return undefined;

  return sanitizeCandidateUrl(candidate);
}

async function fetchHtml(url: string): Promise<{ html?: string; finalUrl?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {};
    }

    return { html: await res.text(), finalUrl: res.url };
  } catch {
    return {};
  }
}

async function resolvePublisherUrl(itemUrl: string): Promise<string | undefined> {
  const decoded = decodeGoogleNewsUrl(itemUrl);
  if (decoded) return decoded;

  const firstFetch = await fetchHtml(itemUrl);
  if (!firstFetch.html) return undefined;

  const $ = cheerio.load(firstFetch.html);
  const canonical = getCanonicalPublisherUrl($);
  if (canonical) return canonical;

  const anchors = $("a")
    .toArray()
    .map((el) => sanitizeCandidateUrl($(el).attr("href")))
    .filter((value): value is string => Boolean(value));

  return anchors[0];
}

function buildFallbackArticle(top: NewsItem, allItems: NewsItem[]): string | undefined {
  const lead = normalizeText(top.description);
  const extras = allItems
    .slice(1, 6)
    .map((item) => {
      const detail = normalizeText(item.description);
      if (detail && detail.length > 40) return `${item.source}: ${detail}`;
      return `${item.source}: ${normalizeText(item.headline)}`;
    })
    .filter((line) => line.length > 30);

  const keyPoints = allItems
    .slice(0, 5)
    .map((item) => normalizeText(item.headline))
    .filter((headline, index, arr) => headline.length > 25 && arr.indexOf(headline) === index)
    .slice(0, 4);

  const sections: string[] = [];
  if (lead.length > 40) {
    sections.push(`Overview:\n${lead}`);
  } else {
    sections.push(`Overview:\n${top.source}: ${normalizeText(top.headline)}`);
  }

  if (extras.length > 0) {
    sections.push(`Timeline:\n${extras.map((line) => `- ${line}`).join("\n")}`);
  }

  if (keyPoints.length > 0) {
    sections.push(`Key points:\n${keyPoints.map((line) => `- ${line}`).join("\n")}`);
  }

  const combined = sections.join("\n\n").trim();
  return combined.length >= 120 ? combined : undefined;
}

async function enrichTopStory(item: NewsItem): Promise<NewsItem> {
  if (item.fullArticle) return item;

  try {
    const resolvedPublisherUrl = await resolvePublisherUrl(item.url);
    const publisherUrl = resolvedPublisherUrl || item.url;
    const firstFetch = await fetchHtml(publisherUrl);
    if (!firstFetch.html) {
      return publisherUrl !== item.url ? { ...item, url: publisherUrl } : item;
    }

    let html = firstFetch.html;
    const $ = cheerio.load(html);
    let fullArticle = extractArticleText($);
    // Only trust og:image when we actually resolved off Google's own domain —
    // otherwise this ends up scraping the Google News interstitial page's
    // generic app icon instead of a real article photo.
    let ogImage = resolvedPublisherUrl
      ? normalizeImageUrl($("meta[property='og:image']").attr("content")) ||
        normalizeImageUrl($("meta[name='twitter:image']").attr("content")) ||
        normalizeImageUrl($("meta[name='twitter:image:src']").attr("content"))
      : undefined;

    // If the Google wrapper doesn't contain enough readable body text,
    // follow canonical publisher URL and extract from there.
    const canonicalPublisherUrl = getCanonicalPublisherUrl($);
    if ((!fullArticle || fullArticle.length < 350) && canonicalPublisherUrl && canonicalPublisherUrl !== publisherUrl) {
      const secondFetch = await fetchHtml(canonicalPublisherUrl);
      if (secondFetch.html) {
        html = secondFetch.html;
        const $$ = cheerio.load(html);
        fullArticle = extractArticleText($$) || fullArticle;

        if (!ogImage) {
          ogImage =
            normalizeImageUrl($$("meta[property='og:image']").attr("content")) ||
            normalizeImageUrl($$("meta[name='twitter:image']").attr("content")) ||
            normalizeImageUrl($$("meta[name='twitter:image:src']").attr("content"));
        }
      }
    }

    if (!fullArticle) {
      const metaDescription =
        normalizeText($("meta[property='og:description']").attr("content")) ||
        normalizeText($("meta[name='description']").attr("content"));

      if (metaDescription) {
        fullArticle = metaDescription;
      }
    }

    if (!fullArticle && !ogImage) {
      return item;
    }

    if (isLowQualityArticleText(fullArticle)) {
      fullArticle = undefined;
    }

    return {
      ...item,
      url: publisherUrl,
      fullArticle,
      imageUrl: ogImage,
    };
  } catch {
    return item;
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || DEFAULT_QUERY;

  const queries = [query, ...FALLBACK_QUERIES.filter((q) => q !== query)];

  for (const q of queries) {
    try {
      const items = await getGoogleNews(q);
      if (items.length > 0) {
        const working = [...items];
        const scanCount = Math.min(6, working.length);
        let bestIndex = -1;
        let best: NewsItem | null = null;

        for (let i = 0; i < scanCount; i += 1) {
          const enriched = await enrichTopStory(working[i]);
          working[i] = enriched;
          if (!isLowQualityArticleText(enriched.fullArticle)) {
            bestIndex = i;
            best = enriched;
            break;
          }
        }

        if (bestIndex > 0 && best) {
          working.splice(bestIndex, 1);
          working.unshift(best);
        }

        if (working[0] && isLowQualityArticleText(working[0].fullArticle)) {
          const fallbackArticle = buildFallbackArticle(working[0], working);
          if (fallbackArticle) {
            working[0] = { ...working[0], fullArticle: fallbackArticle };
          }
        }

        return NextResponse.json({ items: working, query: q });
      }
    } catch {
      // Try the next fallback query.
    }
  }

  return NextResponse.json({ items: [], query, error: "Unable to fetch world news feed right now." });
}
