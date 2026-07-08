// Generic shape for anything scraped from TradingEconomics' heatmap tables —
// commodities, currencies, and crypto all use the exact same table markup.
export interface TEInstrument {
  symbol: string; // TE data-symbol, e.g. "CL1:COM", "EURUSD:CUR", "BTCUSD:CUR"
  path: string; // full TE URL path, e.g. "/commodity/crude-oil", "/euro-area/currency", "/btcusd:cur"
  name: string;
  unit: string;
  category: string;
  price: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  weeklyChangePercent: number | null;
  monthlyChangePercent: number | null;
  ytdChangePercent: number | null;
  yoyChangePercent: number | null;
  date: string | null;
}

export interface TENewsItem {
  headline: string;
  description: string;
  date: string;
  url: string;
}
