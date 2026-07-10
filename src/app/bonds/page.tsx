"use client";

import { useTEInstruments } from "@/lib/useTEInstruments";
import { useTEWatchlist } from "@/lib/useTEWatchlist";
import { AddTEInstrumentForm } from "@/components/AddTEInstrumentForm";
import { TEInstrumentCard } from "@/components/TEInstrumentCard";
import { TEMoversTable } from "@/components/TEMoversTable";
import { TEReferenceTable } from "@/components/TEReferenceTable";
import { MarketActivity } from "@/components/MarketActivity";
import { SiteFooter } from "@/components/SiteFooter";

const DEFAULT_WATCHLIST = [
  "/united-states/government-bond-yield",
  "/germany/government-bond-yield",
  "/united-kingdom/government-bond-yield",
  "/japan/government-bond-yield",
];

export default function BondsPage() {
  const { instruments, loading } = useTEInstruments("/api/bonds");
  const { paths, hydrated, addInstrument, removeInstrument } = useTEWatchlist(
    "stock-tracker:bond-watchlist",
    DEFAULT_WATCHLIST
  );

  const watchlist = paths
    .map((path) => instruments.find((c) => c.path === path))
    .filter((c): c is NonNullable<typeof c> => !!c);

  if (!hydrated) {
    return <div className="p-8 text-sm text-foreground/50">Loading your bond watchlist…</div>;
  }

  return (
    <main className="max-w-5xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
      <header>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Bonds</h1>
        </div>
        <p className="text-sm text-foreground/50 mt-1">
          Sovereign bond yields, movers, and rates news — sourced live from TradingEconomics,
          with Investopedia overviews. The desk view for what moves risk-free rates.
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
          label="Bond"
          buttonLabel="Add bond"
        />

        {loading && instruments.length === 0 && (
          <p className="text-sm text-foreground/50">Loading bond yields…</p>
        )}
        {!loading && watchlist.length === 0 && (
          <p className="text-sm text-foreground/50">Add a bond above to start tracking it.</p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {watchlist.map((c) => (
            <TEInstrumentCard key={c.path} instrument={c} onRemove={removeInstrument} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Biggest movers in bonds</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEMoversTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <MarketActivity market="bonds" />

      <section>
        <h2 className="text-lg font-semibold mb-4">All sovereign bond yields</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEReferenceTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <footer className="pb-6">
        <SiteFooter
          note={
            <>
              Prices, charts, and news via TradingEconomics.com. Overviews via Wikipedia, with
              links out to Investopedia. For personal use — not investment advice.
            </>
          }
        />
      </footer>
    </main>
  );
}
