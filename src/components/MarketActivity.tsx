"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

type Market = "forex" | "crypto" | "index" | "futures";

const DESCRIPTIONS: Record<"all" | Market, string> = {
  all: "Real whole-market news — stocks, indices, forex, and crypto — straight from TradingView's wire, not filtered to your watchlist. For actual insider and institutional trading data, see SEC filings below.",
  forex:
    "Real forex market news — straight from TradingView's wire, not filtered to your watchlist.",
  crypto:
    "Real crypto market news — straight from TradingView's wire, not filtered to your watchlist.",
  index:
    "Real index and broader equity market news — straight from TradingView's wire, not filtered to your watchlist.",
  futures:
    "Real commodities and futures market news — straight from TradingView's wire, not filtered to your watchlist.",
};

// TradingView's Timeline widget in feedMode:"market" pulls from a sparse,
// rarely-updated pool per category. feedMode:"symbol" against a liquid,
// heavily-covered symbol in each category gets a genuinely live wire instead
// (verified empirically — market mode was serving multi-year-old articles).
const REPRESENTATIVE_SYMBOL: Record<Market, string> = {
  forex: "FX:EURUSD",
  crypto: "COINBASE:BTCUSD",
  index: "TVC:SPX",
  futures: "TVC:GOLD",
};

export function MarketActivity({ market }: { market?: Market }) {
  const theme = useColorScheme();

  return (
    <section className="border border-foreground/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Market activity</h2>
      </div>
      <p className="text-xs text-foreground/50 mb-4 max-w-2xl">
        {DESCRIPTIONS[market ?? "all"]}
      </p>

      <TradingViewWidget
        scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
        height={600}
        config={{
          feedMode: market ? "symbol" : "all_symbols",
          ...(market ? { symbol: REPRESENTATIVE_SYMBOL[market] } : {}),
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: 600,
          colorTheme: theme,
          locale: "en",
        }}
      />
    </section>
  );
}
