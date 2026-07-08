"use client";

import { useEffect, useState } from "react";
import type { TEInstrument } from "./teTypes";

const REFRESH_MS = 60_000;

export function useTEInstruments(apiPath: string) {
  const [instruments, setInstruments] = useState<TEInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(apiPath);
        const data = await res.json();
        if (!cancelled) setInstruments(data.instruments ?? []);
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
  }, [apiPath]);

  return { instruments, loading };
}
