"use client";

import { useMarketNews } from "@/lib/useMarketNews";
import { formatRelative } from "@/lib/formatRelative";

// TradingEconomics' own wire is empty for a lot of individual instruments
// (e.g. every crypto pair except Bitcoin), so this mixes in Google News too
// — the same two-provider approach used by the Market Activity section.
// "${name} price" disambiguates generic English words (e.g. "Wheat" alone
// pulls up an NFL player and a Denver suburb) without hurting already-
// specific names like "Bitcoin" or "Nikkei 225" (verified empirically).
export function TENewsList({ name, path }: { name: string; path: string }) {
  const { items, loading } = useMarketNews(`${name} price`, path);

  if (loading && items.length === 0) {
    return <p className="text-sm text-foreground/50">Loading news...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground/50">No recent news found.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={`${item.url}-${i}`}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
          >
            {item.headline}
          </a>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground/50">
            <span className="font-medium text-foreground/70">{item.source}</span>
            <span>·</span>
            <span>{formatRelative(item.publishedAt)}</span>
          </div>
          {item.description && (
            <p className="text-sm text-foreground/70 mt-1 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
