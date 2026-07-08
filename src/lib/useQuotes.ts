"use client";

import { useEffect, useState } from "react";
import type { Quote } from "./types";

const REFRESH_MS = 60_000;

export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const key = symbols.join(",");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!key) {
        setQuotes({});
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/quote?symbols=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, Quote> = {};
        for (const q of data.quotes as Quote[]) map[q.symbol] = q;
        setQuotes(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = key ? setInterval(load, REFRESH_MS) : undefined;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [key]);

  return { quotes, loading };
}
