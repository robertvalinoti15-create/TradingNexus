"use client";

import { useTEInstruments } from "@/lib/useTEInstruments";
import { useTEWatchlist } from "@/lib/useTEWatchlist";
import { AddTEInstrumentForm } from "@/components/AddTEInstrumentForm";
import { TEInstrumentCard } from "@/components/TEInstrumentCard";
import { TEMoversTable } from "@/components/TEMoversTable";
import { TEReferenceTable } from "@/components/TEReferenceTable";
import { INDICES_TV_SYMBOLS } from "@/lib/indicesTvSymbols";
import { INDEX_DISPLAY_NAMES } from "@/lib/indexDisplayNames";
import { MarketActivity } from "@/components/MarketActivity";
import { SiteFooter } from "@/components/SiteFooter";

const DEFAULT_WATCHLIST = [
  "/united-states/stock-market",
  "/indu:ind",
  "/us100:ind",
  "/japan/stock-market",
  "/united-kingdom/stock-market",
];

export default function IndicesPage() {
  const { instruments: rawInstruments, loading } = useTEInstruments("/api/indices");
  // TE's short trading codes (US500, GB100...) are meaningless to
  // Wikipedia/Investopedia search, so swap in a real index name wherever
  // we have one, and give the rest a fighting chance with extra context.
  const instruments = rawInstruments.map((i) => ({
    ...i,
    name: INDEX_DISPLAY_NAMES[i.path] ?? `${i.name} stock market index`,
  }));
  const { paths, hydrated, addInstrument, removeInstrument } = useTEWatchlist(
    "stock-tracker:indices-watchlist",
    DEFAULT_WATCHLIST
  );

  const watchlist = paths
    .map((path) => instruments.find((c) => c.path === path))
    .filter((c): c is NonNullable<typeof c> => !!c);

  if (!hydrated) {
    return <div className="p-8 text-sm text-foreground/50">Loading your indices watchlist…</div>;
  }

  return (
    <main className="max-w-5xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
      <header>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Indices</h1>
        </div>
        <p className="text-sm text-foreground/50 mt-1">
          Charts, movers, and market news for the world indices you choose — S&amp;P 500, Dow
          Jones, Nasdaq, and more — sourced live from TradingEconomics, with Investopedia
          overviews.
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
          label="Index"
          buttonLabel="Add index"
        />

        {loading && instruments.length === 0 && (
          <p className="text-sm text-foreground/50">Loading indices…</p>
        )}
        {!loading && watchlist.length === 0 && (
          <p className="text-sm text-foreground/50">Add an index above to start tracking it.</p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {watchlist.map((c) => (
            <TEInstrumentCard
              key={c.path}
              instrument={c}
              tvSymbol={INDICES_TV_SYMBOLS[c.path]}
              onRemove={removeInstrument}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Biggest movers in indices</h2>
        <div className="border border-foreground/10 rounded-xl p-4">
          <TEMoversTable instruments={instruments} loading={loading} />
        </div>
      </section>

      <MarketActivity market="index" />

      <section>
        <h2 className="text-lg font-semibold mb-4">All world indices</h2>
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
