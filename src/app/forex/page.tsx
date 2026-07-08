"use client";

import { useTEInstruments } from "@/lib/useTEInstruments";
import { useTEWatchlist } from "@/lib/useTEWatchlist";
import { AddTEInstrumentForm } from "@/components/AddTEInstrumentForm";
import { TEInstrumentCard } from "@/components/TEInstrumentCard";
import { TEMoversTable } from "@/components/TEMoversTable";
import { TEReferenceTable } from "@/components/TEReferenceTable";
import { FX_TV_SYMBOLS } from "@/lib/fxTvSymbols";
import { MarketActivity } from "@/components/MarketActivity";

const DEFAULT_WATCHLIST = [
  "/euro-area/currency",
  "/united-kingdom/currency",
  "/japan/currency",
  "/australia/currency",
  "/canada/currency",
  "/switzerland/currency",
];

export default function ForexPage() {
  const { instruments, loading } = useTEInstruments("/api/fx");
  const { paths, hydrated, addInstrument, removeInstrument } = useTEWatchlist(
    "stock-tracker:fx-watchlist",
    DEFAULT_WATCHLIST
  );

  const watchlist = paths
    .map((path) => instruments.find((c) => c.path === path))
    .filter((c): c is NonNullable<typeof c> => !!c);

  if (!hydrated) {
    return <div className="p-8 text-sm text-foreground/50">Loading your currency watchlist…</div>;
  }

  return (
    <main className="max-w-5xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Forex</h1>
        <p className="text-sm text-foreground/50 mt-1">
          Charts, movers, and market news for the currency pairs you choose — sourced live from
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
          label="Currency pair"
          buttonLabel="Add pair"
        />

        {loading && instruments.length === 0 && (
          <p className="text-sm text-foreground/50">Loading currency pairs…</p>
        )}
        {!loading && watchlist.length === 0 && (
          <p className="text-sm text-foreground/50">Add a currency pair above to start tracking it.</p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {watchlist.map((c) => (
            <TEInstrumentCard
              key={c.path}
              instrument={c}
              tvSymbol={FX_TV_SYMBOLS[c.path]}
              onRemove={removeInstrument}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Biggest movers in forex</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEMoversTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <MarketActivity market="forex" />

      <section>
        <h2 className="text-lg font-semibold mb-4">All currency rates</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEReferenceTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <footer className="text-xs text-foreground/30 pb-6">
        Rates, charts, and news via TradingEconomics.com. Overviews via Wikipedia, with links out
        to Investopedia. For personal use — not investment advice.
      </footer>
    </main>
  );
}
