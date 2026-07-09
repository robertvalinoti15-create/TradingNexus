"use client";

import { useState } from "react";
import { useQuotes } from "@/lib/useQuotes";
import { MOVERS_TICKERS } from "@/lib/moversTickers";
import type { Quote } from "@/lib/types";

type Tab = "active" | "gainers" | "losers";
const TABS: Tab[] = ["active", "gainers", "losers"];

function fmtPercent(n: number | null) {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtVolume(n: number | null) {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function MoverRow({ q }: { q: Quote }) {
  const isUp = (q.changePercent ?? 0) >= 0;
  return (
    <li className="flex items-center justify-between gap-4 text-sm py-2">
      <div className="min-w-0">
        <span className="font-medium">{q.symbol}</span>{" "}
        <span className="text-foreground/40 text-xs">{q.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-foreground/60">
          {q.price !== null
            ? q.price.toLocaleString("en-US", { style: "currency", currency: q.currency ?? "USD" })
            : "—"}
        </span>
        <span className="font-mono text-foreground/40 w-14 text-right">{fmtVolume(q.volume)}</span>
        <span className={`font-mono font-medium w-20 text-right ${isUp ? "text-emerald-500" : "text-red-500"}`}>
          {fmtPercent(q.changePercent)}
        </span>
      </div>
    </li>
  );
}

// Yahoo's live screener (v1/finance/screener) and batch-quote (v7/finance/
// quote) endpoints require session-cookie auth and are otherwise rate-
// limited; the plain per-symbol chart endpoint behind /api/quote stays
// open, so this computes gainers/losers/most-active client-side from a
// fixed universe (MOVERS_TICKERS) instead of a live market-wide screener.
export function MarketMovers() {
  const { quotes, loading } = useQuotes(MOVERS_TICKERS);
  const [tab, setTab] = useState<Tab>("active");

  const all = Object.values(quotes).filter((q) => q.changePercent !== null);
  const gainers = [...all].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
  const losers = [...all].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0));
  const active = [...all].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const list = tab === "gainers" ? gainers : tab === "losers" ? losers : active;

  if (loading && all.length === 0) {
    return <p className="text-sm text-foreground/50">Loading movers...</p>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
              t === tab ? "bg-brand-blue text-white" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-foreground/10 max-h-[560px] overflow-y-auto pr-2">
        {list.map((q) => (
          <MoverRow key={q.symbol} q={q} />
        ))}
      </ul>
    </div>
  );
}
