"use client";

import type { Quote, WatchlistItem } from "@/lib/types";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function PortfolioTotal({
  items,
  quotes,
  loading,
}: {
  items: WatchlistItem[];
  quotes: Record<string, Quote>;
  loading: boolean;
}) {
  let total = 0;
  let totalChange = 0;
  let hasAnyPrice = false;

  // Unrealized gain/loss only covers holdings where a cost basis was set —
  // mixing in holdings with no cost basis would silently understate P&L
  // rather than just omitting what isn't knowable.
  let costBasisValue = 0;
  let costBasisMarketValue = 0;
  let hasAnyCostBasis = false;

  for (const item of items) {
    const q = quotes[item.symbol];
    if (!q || q.price === null) continue;
    hasAnyPrice = true;
    total += q.price * item.shares;
    if (q.change !== null) totalChange += q.change * item.shares;

    if (item.costBasis !== undefined && item.costBasis > 0) {
      hasAnyCostBasis = true;
      costBasisValue += item.costBasis * item.shares;
      costBasisMarketValue += q.price * item.shares;
    }
  }

  const totalPrev = total - totalChange;
  const totalChangePercent = totalPrev !== 0 ? (totalChange / totalPrev) * 100 : 0;
  const isUp = totalChange >= 0;

  const unrealizedGainLoss = costBasisMarketValue - costBasisValue;
  const unrealizedGainLossPercent = costBasisValue !== 0 ? (unrealizedGainLoss / costBasisValue) * 100 : 0;
  const isGain = unrealizedGainLoss >= 0;

  return (
    <section className="border border-foreground/10 rounded-xl p-6 flex flex-wrap items-center justify-between gap-6">
      <div>
        <h2 className="text-xs uppercase tracking-wide text-foreground/40 mb-1">
          Total value · {items.length} holding{items.length === 1 ? "" : "s"}
        </h2>
        <div className="text-3xl font-mono font-semibold">
          {loading && !hasAnyPrice ? "Loading..." : formatMoney(total)}
        </div>
        {hasAnyPrice && (
          <div className={`text-sm font-mono mt-1 ${isUp ? "text-emerald-500" : "text-red-500"}`}>
            {isUp ? "+" : ""}
            {formatMoney(totalChange)} ({isUp ? "+" : ""}
            {totalChangePercent.toFixed(2)}%) today
          </div>
        )}
      </div>

      {hasAnyCostBasis && (
        <div>
          <h2 className="text-xs uppercase tracking-wide text-foreground/40 mb-1">Unrealized gain/loss</h2>
          <div className={`text-3xl font-mono font-semibold ${isGain ? "text-emerald-500" : "text-red-500"}`}>
            {isGain ? "+" : ""}
            {formatMoney(unrealizedGainLoss)}
          </div>
          <div className={`text-sm font-mono mt-1 ${isGain ? "text-emerald-500" : "text-red-500"}`}>
            {isGain ? "+" : ""}
            {unrealizedGainLossPercent.toFixed(2)}% vs. cost basis
          </div>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {items.map((item) => {
          const q = quotes[item.symbol];
          const value = q?.price !== null && q?.price !== undefined ? q.price * item.shares : null;
          const gainLoss =
            item.costBasis && q?.price !== null && q?.price !== undefined
              ? (q.price - item.costBasis) * item.shares
              : null;
          return (
            <li key={item.symbol} className="text-foreground/60">
              <span className="font-medium text-foreground">{item.symbol}</span>{" "}
              {item.shares} sh · {value !== null ? formatMoney(value) : "—"}
              {gainLoss !== null && (
                <span className={gainLoss >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {" "}
                  ({gainLoss >= 0 ? "+" : ""}
                  {formatMoney(gainLoss)})
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
