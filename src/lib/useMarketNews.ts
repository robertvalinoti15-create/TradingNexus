"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "./newsTypes";

const REFRESH_MS = 60_000;

export function useMarketNews(query: string, tePath?: string) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams({ q: query });
        if (tePath) params.set("tePath", tePath);
        const res = await fetch(`/api/market-news?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) setItems(data.items ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [query, tePath]);

  return { items, loading };
}
