"use client";

import { useMemo, useState } from "react";
import type { TEInstrument } from "@/lib/teTypes";

export function AddTEInstrumentForm({
  instruments,
  watchlistPaths,
  onAdd,
  label,
  buttonLabel,
}: {
  instruments: TEInstrument[];
  watchlistPaths: string[];
  onAdd: (path: string) => void;
  label: string;
  buttonLabel: string;
}) {
  const available = useMemo(
    () =>
      instruments
        .filter((c) => !watchlistPaths.includes(c.path))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [instruments, watchlistPaths]
  );

  const categories = useMemo(() => Array.from(new Set(available.map((c) => c.category))), [available]);

  const [selected, setSelected] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    onAdd(selected);
    setSelected("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-xs text-foreground/50">
        {label}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-56 mt-0.5 px-2 py-1.5 rounded border border-foreground/15 bg-white text-black text-sm"
        >
          <option value="" disabled>
            {available.length === 0 ? "Loading…" : `Select a ${label.toLowerCase()}`}
          </option>
          {categories.map((cat) => (
            <optgroup key={cat} label={cat}>
              {available
                .filter((c) => c.category === cat)
                .map((c) => (
                  <option key={c.path} value={c.path}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={!selected}
        className="px-4 py-1.5 rounded bg-brand-blue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
