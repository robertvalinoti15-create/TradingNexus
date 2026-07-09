"use client";

import { useState } from "react";
import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

type Market = "forex" | "crypto" | "index" | "futures";

const DESCRIPTIONS: Record<"all" | Market, string> = {
  all: "Real whole-market news — stocks, indices, forex, and crypto — straight from TradingView's wire, not filtered to your watchlist. For actual insider and institutional trading data, see SEC filings below.",
  forex:
    "Real forex market news — straight from TradingView's wire, not filtered to your watchlist. Pick an instrument below for sector-wide coverage.",
  crypto:
    "Real crypto market news — straight from TradingView's wire, not filtered to your watchlist. Pick an instrument below for sector-wide coverage.",
  index:
    "Real index and broader equity market news — straight from TradingView's wire, not filtered to your watchlist. Pick an instrument below for sector-wide coverage.",
  futures:
    "Real commodities and futures market news — straight from TradingView's wire, not filtered to your watchlist. Pick an instrument below for sector-wide coverage.",
};

// TradingView's Timeline widget has no mode that returns "all news for a
// category" and stays fresh: feedMode:"market" pulls from a sparse,
// rarely-updated pool (verified empirically — served multi-year-old
// articles), and feedMode:"symbol" only ever accepts a single instrument —
// comma-separated lists and basket/index symbols like TVC:CRB return no
// data at all. So real sector coverage means multiple single-symbol feeds,
// switchable by tab, each individually checked to carry a live wire.
const SECTOR_SYMBOLS: Record<Market, { label: string; symbol: string }[]> = {
  futures: [
    { label: "Gold", symbol: "TVC:GOLD" },
    { label: "Silver", symbol: "TVC:SILVER" },
    { label: "Oil", symbol: "TVC:USOIL" },
  ],
  forex: [
    { label: "EUR/USD", symbol: "FX:EURUSD" },
    { label: "GBP/USD", symbol: "FX:GBPUSD" },
    { label: "USD/JPY", symbol: "FX:USDJPY" },
  ],
  crypto: [
    { label: "Bitcoin", symbol: "COINBASE:BTCUSD" },
    { label: "Ethereum", symbol: "COINBASE:ETHUSD" },
  ],
  index: [
    { label: "S&P 500", symbol: "TVC:SPX" },
    { label: "Dow Jones", symbol: "TVC:DJI" },
    { label: "Nasdaq", symbol: "TVC:IXIC" },
  ],
};

export function MarketActivity({ market }: { market?: Market }) {
  const theme = useColorScheme();
  const sectorSymbols = market ? SECTOR_SYMBOLS[market] : null;
  const [selected, setSelected] = useState(0);
  const symbol = sectorSymbols?.[selected]?.symbol;

  return (
    <section className="border border-foreground/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Market activity</h2>
      </div>
      <p className="text-xs text-foreground/50 mb-4 max-w-2xl">
        {DESCRIPTIONS[market ?? "all"]}
      </p>

      {sectorSymbols && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sectorSymbols.map((s, i) => (
            <button
              key={s.symbol}
              type="button"
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                i === selected
                  ? "bg-brand-blue text-white"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <TradingViewWidget
        scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
        height={600}
        config={{
          feedMode: symbol ? "symbol" : "all_symbols",
          ...(symbol ? { symbol } : {}),
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
