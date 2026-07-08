"use client";

import { useCallback, useEffect, useState } from "react";

function load(storageKey: string, defaultPaths: string[]): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultPaths;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return defaultPaths;
  } catch {
    return defaultPaths;
  }
}

export function useTEWatchlist(storageKey: string, defaultPaths: string[]) {
  const [paths, setPaths] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function hydrate() {
      setPaths(load(storageKey, defaultPaths));
      setHydrated(true);
    }
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(paths));
  }, [paths, hydrated, storageKey]);

  const addInstrument = useCallback((path: string) => {
    if (!path) return;
    setPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }, []);

  const removeInstrument = useCallback((path: string) => {
    setPaths((prev) => prev.filter((p) => p !== path));
  }, []);

  return { paths, hydrated, addInstrument, removeInstrument };
}
