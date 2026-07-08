import type { TEInstrument } from "@/lib/teTypes";

function fmtPercent(n: number | null) {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function MoverRow({ c }: { c: TEInstrument }) {
  const isUp = (c.dayChangePercent ?? 0) >= 0;
  return (
    <li className="flex items-center justify-between gap-4 text-sm py-2">
      <div className="min-w-0">
        <span className="font-medium">{c.name}</span>{" "}
        <span className="text-foreground/40 text-xs">{c.category}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-foreground/60">
          {c.price !== null ? c.price.toLocaleString("en-US") : "—"} {c.unit}
        </span>
        <span className={`font-mono font-medium w-20 text-right ${isUp ? "text-emerald-500" : "text-red-500"}`}>
          {fmtPercent(c.dayChangePercent)}
        </span>
      </div>
    </li>
  );
}

export function TEMoversTable({ instruments, loading }: { instruments: TEInstrument[]; loading: boolean }) {
  const ranked = instruments
    .filter((c) => c.dayChangePercent !== null)
    .sort((a, b) => (b.dayChangePercent ?? 0) - (a.dayChangePercent ?? 0));

  const gainers = ranked.slice(0, 8);
  const losers = ranked.slice(-8).reverse();

  if (loading && instruments.length === 0) {
    return <p className="text-sm text-foreground/50">Loading movers...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-medium text-emerald-500 mb-1">Biggest gainers today</h3>
        <ul className="divide-y divide-foreground/10">
          {gainers.map((c) => (
            <MoverRow key={c.path} c={c} />
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium text-red-500 mb-1">Biggest losers today</h3>
        <ul className="divide-y divide-foreground/10">
          {losers.map((c) => (
            <MoverRow key={c.path} c={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}
