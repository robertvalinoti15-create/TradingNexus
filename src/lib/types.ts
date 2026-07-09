export type Exchange = "NYSE" | "NASDAQ" | "AMEX";

export interface WatchlistItem {
  symbol: string; // bare ticker, e.g. "KO"
  exchange: Exchange; // used to build the TradingView symbol, e.g. NYSE:KO
  shares: number; // shares held, used for portfolio total
  costBasis?: number; // avg price paid per share; optional, powers gain/loss
  addedAt: number;
}

export interface Quote {
  symbol: string;
  name: string | null;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  currency: string | null;
  exchange: Exchange | null; // detected from the upstream quote, not user input
  error?: string;
}
