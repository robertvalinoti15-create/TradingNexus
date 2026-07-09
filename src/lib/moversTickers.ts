// A diverse, liquid slice of large/mid-cap US equities across sectors, used
// to compute a real "biggest movers" ranking. Yahoo's screener/batch-quote
// endpoints (v1/finance/screener, v7/finance/quote) require session-cookie
// auth and are otherwise rate-limited; the plain per-symbol chart endpoint
// (v8/finance/chart, already used by /api/quote) stays open, so movers are
// computed client-side from a fixed universe rather than a live screener.
export const MOVERS_TICKERS = [
  // Technology
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO", "ADBE", "CRM",
  "ORCL", "CSCO", "INTC", "AMD", "QCOM", "IBM", "NOW", "TXN",
  // Financials
  "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "C", "BLK", "AXP",
  // Healthcare
  "UNH", "JNJ", "ABBV", "MRK", "LLY", "PFE", "TMO", "ABT", "GILD", "MDT", "ISRG",
  // Consumer
  "WMT", "PG", "HD", "KO", "PEP", "COST", "MCD", "NKE", "SBUX", "DIS",
  // Energy & Industrials
  "XOM", "CVX", "GE", "CAT", "BA", "HON", "UPS", "RTX", "DE",
  // Communications & other
  "T", "VZ", "CMCSA", "NFLX", "BRK-B", "UNP", "LOW", "PM",
];
