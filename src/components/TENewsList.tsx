"use client";

import { useEffect, useState } from "react";
import type { TENewsItem } from "@/lib/teTypes";

export function TENewsList({ path }: { path: string }) {
  const [items, setItems] = useState<TENewsItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/te-news?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (items === null) {
    return <p className="text-sm text-foreground/50">Loading news...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground/50">No recent news found.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
          >
            {item.headline}
          </a>
          <p className="text-xs text-foreground/50 mt-0.5">{item.date}</p>
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
