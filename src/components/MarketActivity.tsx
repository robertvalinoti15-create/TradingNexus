"use client";

import { useState } from "react";
import { useMarketNews } from "@/lib/useMarketNews";
import { formatRelative } from "@/lib/formatRelative";

type Market = "forex" | "crypto" | "index" | "futures" | "bonds";

const DESCRIPTIONS: Record<"all" | Market, string> = {
  all: "Real market news for stocks, indices, forex, and crypto — mixed from multiple outlets via Google News plus TradingEconomics' own wire, not filtered to your watchlist. For actual insider and institutional trading data, see SEC filings below.",
  forex:
    "Real forex news, mixed from multiple outlets via Google News plus TradingEconomics' own wire. Pick an instrument below for sector-wide coverage.",
  crypto:
    "Real crypto news, mixed from multiple outlets via Google News plus TradingEconomics' own wire. Pick an instrument below for sector-wide coverage.",
  index:
    "Real index and broader equity news, mixed from multiple outlets via Google News plus TradingEconomics' own wire. Pick an instrument below for sector-wide coverage.",
  futures:
    "Real commodities and futures news, mixed from multiple outlets via Google News plus TradingEconomics' own wire. Pick an instrument below for sector-wide coverage.",
  bonds:
    "Real bond market and rates news, mixed from multiple outlets via Google News plus TradingEconomics' own wire. Pick an instrument below for sector-wide coverage.",
};

interface SectorTab {
  label: string;
  googleQuery: string;
  tePath?: string;
}

// Two independent providers, merged and sorted by real publish time:
// Google News' RSS search (aggregates outside outlets — Reuters, Bloomberg,
// CNBC, etc., no API key needed) and TradingEconomics' own news wire
// (already used elsewhere in the app, keyed by TE's instrument path).
const SECTOR_TABS: Record<Market, SectorTab[]> = {
  futures: [
    { label: "Gold", googleQuery: "gold price", tePath: "/commodity/gold" },
    { label: "Silver", googleQuery: "silver price", tePath: "/commodity/silver" },
    { label: "Oil", googleQuery: "oil price", tePath: "/commodity/crude-oil" },
  ],
  forex: [
    { label: "EUR/USD", googleQuery: "EUR USD euro dollar", tePath: "/euro-area/currency" },
    { label: "GBP/USD", googleQuery: "GBP USD pound dollar", tePath: "/united-kingdom/currency" },
    { label: "USD/JPY", googleQuery: "USD JPY dollar yen", tePath: "/japan/currency" },
  ],
  crypto: [
    { label: "Bitcoin", googleQuery: "bitcoin price", tePath: "/btcusd:cur" },
    { label: "Ethereum", googleQuery: "ethereum price", tePath: "/ethusd:cur" },
  ],
  index: [
    { label: "S&P 500", googleQuery: "S&P 500", tePath: "/united-states/stock-market" },
    { label: "Dow Jones", googleQuery: "Dow Jones", tePath: "/indu:ind" },
    { label: "Nasdaq", googleQuery: "Nasdaq", tePath: "/us100:ind" },
  ],
  bonds: [
    { label: "US 10Y", googleQuery: "10 year treasury yield", tePath: "/united-states/government-bond-yield" },
    { label: "Fed / FOMC", googleQuery: "Federal Reserve interest rate decision" },
    { label: "Germany 10Y", googleQuery: "German bund yield", tePath: "/germany/government-bond-yield" },
  ],
};

const ALL_MARKETS_TAB: SectorTab = { label: "All markets", googleQuery: "stock market today" };

export function MarketActivity({ market }: { market?: Market }) {
  const sectorTabs = market ? SECTOR_TABS[market] : null;
  const [selected, setSelected] = useState(0);
  const tab = sectorTabs ? sectorTabs[selected] : ALL_MARKETS_TAB;

  const { items, loading } = useMarketNews(tab.googleQuery, tab.tePath);

  return (
    <section className="border border-foreground/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Market activity</h2>
      </div>
      <p className="text-xs text-foreground/50 mb-4 max-w-2xl">{DESCRIPTIONS[market ?? "all"]}</p>

      {sectorTabs && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sectorTabs.map((s, i) => (
            <button
              key={s.label}
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

      {loading && items.length === 0 && <p className="text-sm text-foreground/50">Loading news…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-foreground/50">No recent news found.</p>}

      <ul className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className="border-b border-foreground/5 pb-4 last:border-b-0 last:pb-0">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
              {item.headline}
            </a>
            <div className="flex items-center gap-2 mt-1 text-xs text-foreground/50">
              <span className="font-medium text-foreground/70">{item.source}</span>
              <span>·</span>
              <span>{formatRelative(item.publishedAt)}</span>
            </div>
            {item.description && (
              <p className="text-sm text-foreground/70 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
