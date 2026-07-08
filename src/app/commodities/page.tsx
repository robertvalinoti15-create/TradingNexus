"use client";

import { useTEInstruments } from "@/lib/useTEInstruments";
import { useTEWatchlist } from "@/lib/useTEWatchlist";
import { AddTEInstrumentForm } from "@/components/AddTEInstrumentForm";
import { TEInstrumentCard } from "@/components/TEInstrumentCard";
import { TEMoversTable } from "@/components/TEMoversTable";
import { TEReferenceTable } from "@/components/TEReferenceTable";
import { COMMODITY_TV_SYMBOLS } from "@/lib/commodityTvSymbols";
import { MarketActivity } from "@/components/MarketActivity";

const DEFAULT_WATCHLIST = [
  "/commodity/crude-oil",
  "/commodity/natural-gas",
  "/commodity/gold",
  "/commodity/silver",
  "/commodity/copper",
  "/commodity/wheat",
];

export default function CommoditiesPage() {
  const { instruments, loading } = useTEInstruments("/api/commodities");
  const { paths, hydrated, addInstrument, removeInstrument } = useTEWatchlist(
    "stock-tracker:commodity-watchlist",
    DEFAULT_WATCHLIST
  );

  const watchlist = paths
    .map((path) => instruments.find((c) => c.path === path))
    .filter((c): c is NonNullable<typeof c> => !!c);

  if (!hydrated) {
    return <div className="p-8 text-sm text-foreground/50">Loading your commodity watchlist…</div>;
  }

  return (
    <main className="max-w-5xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Commodities</h1>
        <p className="text-sm text-foreground/50 mt-1">
          Charts, movers, and market news for the commodities you choose — sourced live from
          TradingEconomics, with Investopedia overviews.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your watchlist</h2>
        </div>
        <AddTEInstrumentForm
          instruments={instruments}
          watchlistPaths={paths}
          onAdd={addInstrument}
          label="Commodity"
          buttonLabel="Add commodity"
        />

        {loading && instruments.length === 0 && (
          <p className="text-sm text-foreground/50">Loading commodities…</p>
        )}
        {!loading && watchlist.length === 0 && (
          <p className="text-sm text-foreground/50">Add a commodity above to start tracking it.</p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {watchlist.map((c) => (
            <TEInstrumentCard
              key={c.path}
              instrument={c}
              tvSymbol={COMMODITY_TV_SYMBOLS[c.path]}
              onRemove={removeInstrument}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Biggest movers in commodities</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEMoversTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <MarketActivity market="futures" />

      <section>
        <h2 className="text-lg font-semibold mb-4">All commodity prices</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEReferenceTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <footer className="text-xs text-foreground/30 pb-6">
        Prices, charts, and news via TradingEconomics.com. Overviews via Wikipedia, with links
        out to Investopedia. For personal use — not investment advice.
      </footer>
    </main>
  );
}
