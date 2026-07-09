"use client";

import { useWatchlist } from "@/lib/useWatchlist";
import { useQuotes } from "@/lib/useQuotes";
import { PortfolioTotal } from "@/components/PortfolioTotal";
import { AddStockForm } from "@/components/AddStockForm";
import { StockCard } from "@/components/StockCard";
import { MarketActivity } from "@/components/MarketActivity";
import { SecFilings } from "@/components/SecFilings";

export default function StocksPage() {
  const { items, hydrated, addStock, removeStock, updateShares } = useWatchlist();
  const symbols = items.map((i) => i.symbol);
  const { quotes, loading } = useQuotes(symbols);

  if (!hydrated) {
    return <div className="p-8 text-sm text-foreground/50">Loading your watchlist…</div>;
  }

  return (
    <main className="max-w-5xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Stocks</h1>
        <p className="text-sm text-foreground/50 mt-1">
          Your watchlist, charts, and what&apos;s actually moving the market — sourced live, not
          simulated.
        </p>
      </header>

      <PortfolioTotal items={items} quotes={quotes} loading={loading} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your watchlist</h2>
        </div>
        <AddStockForm onAdd={addStock} />

        {items.length === 0 && (
          <p className="text-sm text-foreground/50">Add a stock above to start tracking it.</p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {items.map((item) => (
            <StockCard
              key={item.symbol}
              item={item}
              quote={quotes[item.symbol]}
              onRemove={removeStock}
              onSharesChange={updateShares}
            />
          ))}
        </div>
      </section>

      <MarketActivity />

      <SecFilings symbols={symbols} />

      <footer className="text-xs text-foreground/30 pb-6">
        Quotes via Yahoo Finance (unofficial, delayed). Charts &amp; news via TradingView.
        Company overviews via Wikipedia. Insider &amp; institutional data via SEC EDGAR. For
        personal use — not investment advice.
      </footer>
    </main>
  );
}
