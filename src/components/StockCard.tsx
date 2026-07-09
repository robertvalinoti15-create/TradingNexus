"use client";

import type { Quote, WatchlistItem } from "@/lib/types";
import { StockChart } from "./StockChart";
import { StockNews } from "./StockNews";
import { CompanyExplanation } from "./CompanyExplanation";

function formatMoney(n: number | null, currency: string | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function StockCard({
  item,
  quote,
  onRemove,
  onSharesChange,
  onCostBasisChange,
}: {
  item: WatchlistItem;
  quote: Quote | undefined;
  onRemove: (symbol: string) => void;
  onSharesChange: (symbol: string, shares: number) => void;
  onCostBasisChange: (symbol: string, costBasis: number | undefined) => void;
}) {
  const tvSymbol = `${item.exchange}:${item.symbol}`;
  const isUp = (quote?.change ?? 0) >= 0;

  const hasCostBasis = item.costBasis !== undefined && item.costBasis > 0;
  const gainLoss =
    hasCostBasis && quote?.price !== null && quote?.price !== undefined
      ? (quote.price - item.costBasis!) * item.shares
      : null;
  const gainLossPercent =
    hasCostBasis && gainLoss !== null ? (gainLoss / (item.costBasis! * item.shares)) * 100 : null;
  const isGain = (gainLoss ?? 0) >= 0;

  return (
    <section className="border border-foreground/10 rounded-xl p-4 flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold">{item.symbol}</h3>
            <span className="text-xs text-foreground/50">{tvSymbol}</span>
          </div>
          {quote?.name && <p className="text-sm text-foreground/60">{quote.name}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-mono">{formatMoney(quote?.price ?? null, quote?.currency ?? null)}</div>
            {quote?.change !== null && quote?.change !== undefined && (
              <div className={`text-sm font-mono ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                {isUp ? "+" : ""}
                {quote.change.toFixed(2)} ({isUp ? "+" : ""}
                {quote.changePercent?.toFixed(2)}%)
              </div>
            )}
            {gainLoss !== null && (
              <div className={`text-xs font-mono mt-0.5 ${isGain ? "text-emerald-500" : "text-red-500"}`}>
                {isGain ? "+" : ""}
                {formatMoney(gainLoss, quote?.currency ?? null)} ({isGain ? "+" : ""}
                {gainLossPercent!.toFixed(2)}%) gain/loss
              </div>
            )}
          </div>

          <label className="flex flex-col items-start text-xs text-foreground/50">
            Shares
            <input
              type="number"
              min={0}
              step="any"
              value={item.shares}
              onChange={(e) => onSharesChange(item.symbol, parseFloat(e.target.value) || 0)}
              className="w-20 mt-0.5 px-2 py-1 rounded border border-foreground/15 bg-transparent text-sm"
            />
          </label>

          <label className="flex flex-col items-start text-xs text-foreground/50">
            Cost basis
            <input
              type="number"
              min={0}
              step="any"
              value={item.costBasis ?? ""}
              placeholder="—"
              onChange={(e) =>
                onCostBasisChange(item.symbol, e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="w-24 mt-0.5 px-2 py-1 rounded border border-foreground/15 bg-transparent text-sm"
            />
          </label>

          <button
            onClick={() => onRemove(item.symbol)}
            className="text-xs text-foreground/40 hover:text-red-500 transition-colors"
            aria-label={`Remove ${item.symbol}`}
          >
            Remove
          </button>
        </div>
      </header>

      <StockChart tvSymbol={tvSymbol} />

      <div>
        <h4 className="text-xs uppercase tracking-wide text-foreground/40 mb-2">About</h4>
        <CompanyExplanation symbol={item.symbol} />
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-foreground/40 mb-2">Recent news</h4>
        <StockNews name={quote?.name ?? item.symbol} />
      </div>
    </section>
  );
}
