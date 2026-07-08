"use client";

import { useCallback, useEffect, useState } from "react";
import type { Exchange, WatchlistItem } from "./types";

const STORAGE_KEY = "stock-tracker:watchlist";

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "KO", exchange: "NYSE", shares: 10, addedAt: Date.now() },
  { symbol: "JPM", exchange: "NYSE", shares: 5, addedAt: Date.now() },
  { symbol: "DIS", exchange: "NYSE", shares: 8, addedAt: Date.now() },
];

function load(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WATCHLIST;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function hydrate() {
      setItems(load());
      setHydrated(true);
    }
    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addStock = useCallback((symbol: string, exchange: Exchange, shares: number) => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    setItems((prev) => {
      if (prev.some((i) => i.symbol === clean)) return prev;
      return [...prev, { symbol: clean, exchange, shares: shares || 0, addedAt: Date.now() }];
    });
  }, []);

  const removeStock = useCallback((symbol: string) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }, []);

  const updateShares = useCallback((symbol: string, shares: number) => {
    setItems((prev) => prev.map((i) => (i.symbol === symbol ? { ...i, shares } : i)));
  }, []);

  return { items, hydrated, addStock, removeStock, updateShares };
}
