"use client";

import { useEffect, useState } from "react";

export interface WikiSummary {
  title: string;
  description: string | null;
  extract: string;
  pageUrl: string;
  thumbnailUrl: string | null;
}

// Wikipedia's REST API is CORS-open, so this is called directly from the
// browser rather than proxied through a route handler.
export function useWikipediaSummary(query: string | null) {
  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!query) {
        setStatus("error");
        return;
      }
      setStatus("loading");
      setSummary(null);
      try {
        const searchRes = await fetch(
          `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=1`
        );
        const searchData = await searchRes.json();
        const top = searchData?.pages?.[0];
        if (!top) throw new Error("No match found");

        const summaryRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(top.key)}`
        );
        if (!summaryRes.ok) throw new Error("Summary fetch failed");
        const summaryData = await summaryRes.json();

        if (cancelled) return;
        setSummary({
          title: summaryData.title,
          description: summaryData.description ?? null,
          extract: summaryData.extract ?? "",
          pageUrl: summaryData.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${top.key}`,
          thumbnailUrl: summaryData.thumbnail?.source ?? null,
        });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { summary, status };
}
