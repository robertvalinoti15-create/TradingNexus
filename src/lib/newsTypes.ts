// Shared shape for news items regardless of which provider they came from,
// so a feed can mix Google News (many outlets: Reuters, Bloomberg, etc.)
// with TradingEconomics' own editorial/market-commentary wire and sort them
// together by actual publish time.
export interface NewsItem {
  headline: string;
  url: string;
  source: string; // publisher name, e.g. "Reuters", "TradingEconomics"
  provider: "Google News" | "TradingEconomics";
  publishedAt: string; // ISO 8601
  description?: string;
  imageUrl?: string;
  fullArticle?: string;
}
