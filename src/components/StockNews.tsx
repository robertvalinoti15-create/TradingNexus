"use client";

import { useMarketNews } from "@/lib/useMarketNews";
import { formatRelative } from "@/lib/formatRelative";

// Same mixed-provider approach as the TradingEconomics-backed pages:
// Google News' RSS search (Reuters, Bloomberg, Yahoo Finance, Motley Fool,
// Barron's, etc.). There's no TradingEconomics equivalent for individual
// equities, so this is Google News alone — still genuinely multi-outlet,
// unlike the single embedded TradingView feed it replaces, and it stays
// fresh where that widget didn't for less-covered tickers.
function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function StockNews({ name }: { name: string }) {
  const { items: allItems, loading } = useMarketNews(`${name} stock`);
  const items = allItems.filter((item) => isToday(item.publishedAt)).slice(0, 3);

  if (loading && items.length === 0) {
    return <p className="text-sm text-foreground/50">Loading news...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground/50">No news from today yet.</p>;
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
