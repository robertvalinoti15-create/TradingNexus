"use client";

import { useEffect, useState } from "react";
import { useWikipediaSummary } from "@/lib/useWikipediaSummary";

export function CompanyExplanation({ symbol }: { symbol: string }) {
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/company?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setQuery(data.title ?? `${symbol} stock ticker company`);
      })
      .catch(() => {
        if (!cancelled) setQuery(`${symbol} stock ticker company`);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const { summary, status } = useWikipediaSummary(query);

  if (!query || status === "loading") {
    return <p className="text-sm text-foreground/50">Loading company overview...</p>;
  }

  if (status === "error" || !summary) {
    return (
      <p className="text-sm text-foreground/50">
        Couldn&apos;t load a company overview for {symbol}.
      </p>
    );
  }

  return (
    <div className="flex gap-4">
      {summary.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={summary.thumbnailUrl}
          alt=""
          className="w-16 h-16 object-cover rounded-md shrink-0 mt-0.5"
        />
      )}
      <div className="min-w-0">
        <h4 className="font-medium text-sm">
          {summary.title}
          {summary.description && (
            <span className="text-foreground/50 font-normal"> — {summary.description}</span>
          )}
        </h4>
        <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{summary.extract}</p>
        <a
          href={summary.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-blue hover:underline mt-1 inline-block"
        >
          Read more on Wikipedia →
        </a>
      </div>
    </div>
  );
}
