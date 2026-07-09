import type { TEInstrument } from "@/lib/teTypes";
import { TEChart } from "./TEChart";
import { TEExplanation } from "./TEExplanation";
import { TENewsList } from "./TENewsList";

function fmtPercent(n: number | null) {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function TEInstrumentCard({
  instrument,
  tvSymbol,
  onRemove,
}: {
  instrument: TEInstrument;
  tvSymbol?: string;
  onRemove: (path: string) => void;
}) {
  const isUp = (instrument.dayChangePercent ?? 0) >= 0;

  return (
    <section className="border border-foreground/10 rounded-xl p-4 flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{instrument.name}</h3>
          <span className="text-xs text-foreground/50">
            {instrument.category}
            {instrument.unit ? ` · ${instrument.unit}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-mono">
              {instrument.price !== null ? instrument.price.toLocaleString("en-US") : "—"}
            </div>
            <div className={`text-sm font-mono ${isUp ? "text-emerald-500" : "text-red-500"}`}>
              {fmtPercent(instrument.dayChangePercent)} today
            </div>
          </div>
          <button
            onClick={() => onRemove(instrument.path)}
            className="text-xs text-foreground/40 hover:text-red-500 transition-colors"
            aria-label={`Remove ${instrument.name}`}
          >
            Remove
          </button>
        </div>
      </header>

      <TEChart symbol={instrument.symbol} path={instrument.path} tvSymbol={tvSymbol} />

      <div>
        <h4 className="text-xs uppercase tracking-wide text-foreground/40 mb-2">About</h4>
        <TEExplanation name={instrument.name} />
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-foreground/40 mb-2">Recent news</h4>
        <TENewsList name={instrument.name} path={instrument.path} />
      </div>
    </section>
  );
}
