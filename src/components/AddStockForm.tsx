"use client";

import { useState } from "react";
import type { Exchange, Quote } from "@/lib/types";

export function AddStockForm({
  onAdd,
}: {
  onAdd: (symbol: string, exchange: Exchange, shares: number) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState<Exchange>("NYSE");
  const [shares, setShares] = useState("1");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;

    setStatus("checking");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(clean)}`);
      const data = await res.json();
      const quote: Quote | undefined = data.quotes?.[0];

      if (!quote || quote.price === null) {
        setStatus("error");
        setErrorMsg(`Couldn't find "${clean}" — check the ticker and try again.`);
        return;
      }

      // Prefer the exchange we actually detected from the quote; the dropdown
      // is only a fallback for symbols we can't confidently classify.
      onAdd(clean, quote.exchange ?? exchange, parseFloat(shares) || 0);
      setSymbol("");
      setShares("1");
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the quote service. Try again in a moment.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-foreground/50">
          Ticker
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. KO"
            className="w-28 mt-0.5 px-2 py-1.5 rounded border border-foreground/15 bg-transparent text-sm uppercase"
          />
        </label>

        <label className="flex flex-col text-xs text-foreground/50">
          Exchange (fallback)
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value as Exchange)}
            className="w-32 mt-0.5 px-2 py-1.5 rounded border border-foreground/15 bg-transparent text-sm"
          >
            <option value="NYSE">NYSE</option>
            <option value="NASDAQ">NASDAQ</option>
            <option value="AMEX">AMEX</option>
          </select>
        </label>

        <label className="flex flex-col text-xs text-foreground/50">
          Shares
          <input
            type="number"
            min={0}
            step="any"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-20 mt-0.5 px-2 py-1.5 rounded border border-foreground/15 bg-transparent text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={status === "checking"}
          className="px-4 py-1.5 rounded bg-brand-blue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === "checking" ? "Checking…" : "Add stock"}
        </button>
      </form>
      {status === "error" && <p className="text-xs text-red-500">{errorMsg}</p>}
      <p className="text-xs text-foreground/40">
        Exchange is auto-detected from the ticker — the dropdown is only used if that fails.
      </p>
    </div>
  );
}
