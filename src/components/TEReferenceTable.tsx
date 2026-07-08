"use client";

import { useState } from "react";
import type { TEInstrument } from "@/lib/teTypes";

function fmtPercent(n: number | null) {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pctClass(n: number | null) {
  if (n === null) return "text-foreground/40";
  return n >= 0 ? "text-emerald-500" : "text-red-500";
}

export function TEReferenceTable({
  instruments,
  loading,
}: {
  instruments: TEInstrument[];
  loading: boolean;
}) {
  const categories = Array.from(new Set(instruments.map((c) => c.category)));
  const [active, setActive] = useState<string | null>(null);
  const activeCategory = active ?? categories[0] ?? null;

  if (loading && instruments.length === 0) {
    return <p className="text-sm text-foreground/50">Loading prices...</p>;
  }

  const rows = instruments.filter((c) => c.category === activeCategory);

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4 border-b border-foreground/10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              activeCategory === cat
                ? "border-brand-blue text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/40 text-xs uppercase">
              <th className="font-normal pb-2">Name</th>
              <th className="font-normal pb-2 text-right">Price</th>
              <th className="font-normal pb-2 text-right">Day</th>
              <th className="font-normal pb-2 text-right">Weekly</th>
              <th className="font-normal pb-2 text-right">Monthly</th>
              <th className="font-normal pb-2 text-right">YTD</th>
              <th className="font-normal pb-2 text-right">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {rows.map((c) => (
              <tr key={c.path}>
                <td className="py-2">
                  <a
                    href={`https://tradingeconomics.com${c.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {c.name}
                  </a>
                  <span className="text-foreground/40 text-xs"> {c.unit}</span>
                </td>
                <td className="py-2 text-right font-mono">
                  {c.price !== null ? c.price.toLocaleString("en-US") : "—"}
                </td>
                <td className={`py-2 text-right font-mono ${pctClass(c.dayChangePercent)}`}>
                  {fmtPercent(c.dayChangePercent)}
                </td>
                <td className={`py-2 text-right font-mono ${pctClass(c.weeklyChangePercent)}`}>
                  {fmtPercent(c.weeklyChangePercent)}
                </td>
                <td className={`py-2 text-right font-mono ${pctClass(c.monthlyChangePercent)}`}>
                  {fmtPercent(c.monthlyChangePercent)}
                </td>
                <td className={`py-2 text-right font-mono ${pctClass(c.ytdChangePercent)}`}>
                  {fmtPercent(c.ytdChangePercent)}
                </td>
                <td className={`py-2 text-right font-mono ${pctClass(c.yoyChangePercent)}`}>
                  {fmtPercent(c.yoyChangePercent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
