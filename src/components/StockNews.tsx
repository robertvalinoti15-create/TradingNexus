"use client";

import { useMarketNews } from "@/lib/useMarketNews";
import { formatRelative } from "@/lib/formatRelative";

// Same mixed-provider approach as the TradingEconomics-backed pages:
// Google News' RSS search (Reuters, Bloomberg, Yahoo Finance, Motley Fool,
// Barron's, etc.). There's no TradingEconomics equivalent for individual
// equities, so this is Google News alone — still genuinely multi-outlet,
// unlike the single embedded TradingView feed it replaces, and it stays
// fresh where that widget didn't for less-covered tickers.
export function StockNews({ name }: { name: string }) {
  const { items, loading } = useMarketNews(`${name} stock`);

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
