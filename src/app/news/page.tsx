"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRelative } from "@/lib/formatRelative";
import { MARKETS_BANNER_IMAGE, NEWS_CATEGORY_IMAGES } from "@/lib/newsCategoryImages";
import type { NewsItem } from "@/lib/newsTypes";

const FEEDS = [
  {
    key: "markets",
    label: "Markets",
    query: "financial markets",
    blurb: "Equities, bonds, and macro headlines moving the day.",
  },
  {
    key: "tech",
    label: "Tech",
    query: "technology stocks",
    blurb: "Big tech names, semis, and platform news in focus.",
  },
  {
    key: "economy",
    label: "Economy",
    query: "economy inflation fed",
    blurb: "Central bank decisions, jobs, inflation, and policy shifts.",
  },
  {
    key: "crypto",
    label: "Crypto",
    query: "crypto markets",
    blurb: "Bitcoin, Ethereum, and digital-asset market momentum.",
  },
  {
    key: "commodities",
    label: "Commodities",
    query: "commodities oil gold natural gas",
    blurb: "Energy, metals, and agriculture moving the global economy.",
  },
] as const;

type FeedState = {
  key: string;
  label: string;
  query: string;
  blurb: string;
  items: NewsItem[];
  loading: boolean;
  error?: string;
};

export default function NewsPage() {
  const [sections, setSections] = useState<FeedState[]>(() =>
    FEEDS.map((feed) => ({ ...feed, items: [], loading: true }))
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled(
        FEEDS.map(async (feed) => {
          const res = await fetch(`/api/market-news?q=${encodeURIComponent(feed.query)}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch ${feed.label}`);
          }

          const data = await res.json();
          return {
            ...feed,
            items: (data.items ?? []) as NewsItem[],
            loading: false,
            error: undefined,
          } satisfies FeedState;
        })
      );

      if (cancelled) return;

      const next = results.map((result, index) => {
        const feed = FEEDS[index];
        if (result.status === "fulfilled") {
          return result.value;
        }

        return {
          ...feed,
          items: [],
          loading: false,
          error: "Unable to load headlines right now.",
        } satisfies FeedState;
      });

      setSections(next);
    }

    load();
    const interval = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const featured = useMemo(() => {
    const marketFeed = sections.find((section) => section.key === "markets");
    return marketFeed?.items[0];
  }, [sections]);

  const marketItems = useMemo(() => {
    const marketFeed = sections.find((section) => section.key === "markets");
    return marketFeed?.items.slice(1, 10) ?? [];
  }, [sections]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Live Market Newsroom</h1>
            <div className="rounded-full border border-foreground/10 px-3 py-2 text-sm text-foreground/60 w-fit">
              Auto-refreshing every minute
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-6">
          <article className="overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-sm">
            <div className="h-72 sm:h-96 w-full overflow-hidden bg-foreground/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MARKETS_BANNER_IMAGE.url}
                alt={MARKETS_BANNER_IMAGE.alt}
                title={MARKETS_BANNER_IMAGE.credit}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/45">Top story</p>
                <h2 className="mt-1 text-xl font-semibold">Markets</h2>
              </div>
              <span className="text-xs text-foreground/50">Updated live</span>
            </div>

            {sections.find((section) => section.key === "markets")?.loading && !featured ? (
              <p className="mt-6 text-sm text-foreground/50">Loading top headlines…</p>
            ) : featured ? (
              <>
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block rounded-xl border border-foreground/10 bg-background/60 p-4 hover:border-brand-blue/40 transition-colors"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">{featured.source}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">{featured.headline}</h3>
                  {featured.description ? (
                    <p className="mt-2 text-sm text-foreground/65 leading-relaxed line-clamp-3">{featured.description}</p>
                  ) : null}
                  <div className="mt-3 text-xs text-foreground/45">{formatRelative(featured.publishedAt)}</div>
                </a>

                <div style={{ maxHeight: "24rem", overflowY: "auto" }} className="mt-5 pr-2">
                  <ul className="flex flex-col gap-3">
                    {marketItems.map((item, index) => (
                      <li key={`${item.url}-${index}`} className="border-b border-foreground/10 pb-3 last:border-none last:pb-0">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                          {item.headline}
                        </a>
                        <div className="mt-1 flex items-center gap-2 text-xs text-foreground/45">
                          <span>{item.source}</span>
                          <span>·</span>
                          <span>{formatRelative(item.publishedAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="mt-6 text-sm text-foreground/50">No headlines available yet.</p>
            )}
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            {sections
              .filter((section) => section.key !== "markets")
              .map((section) => {
                const image = NEWS_CATEGORY_IMAGES[section.key];
                return (
                <article key={section.key} className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {image && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.alt}
                          title={image.credit}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{section.label}</h3>
                      <p className="mt-0.5 text-xs text-foreground/50">{section.blurb}</p>
                    </div>
                  </div>

                  {section.loading ? (
                    <p className="mt-4 text-sm text-foreground/50">Loading…</p>
                  ) : section.error ? (
                    <p className="mt-4 text-sm text-foreground/50">{section.error}</p>
                  ) : (
                    <ul className="mt-4 flex flex-col gap-2">
                      {section.items.slice(0, 3).map((item, index) => (
                        <li key={`${item.url}-${index}`}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                            {item.headline}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
                );
              })}
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 pb-10 pt-4">
        <SiteFooter
          note={
            <>
              Headlines are aggregated from live market publishers and financial news sources.
              For personal use — not investment advice.
            </>
          }
        />
      </footer>
    </main>
  );
}
