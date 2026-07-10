"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRelative } from "@/lib/formatRelative";
import type { NewsItem } from "@/lib/newsTypes";

type StoryBlock = {
  heading?: string;
  paragraphs: string[];
  bullets: string[];
};

function ArticleImage({
  src,
  alt,
  className,
  fallbackSrc,
}: {
  src?: string;
  alt: string;
  className: string;
  fallbackSrc?: string;
}) {
  const [errored, setErrored] = useState(false);
  const resolved = !errored && src ? src : fallbackSrc;
  if (!resolved) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolved} alt={alt} className={className} onError={() => setErrored(true)} />
  );
}

function parseStoryBlocks(text?: string): StoryBlock[] {
  if (!text) return [];

  return text
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return { paragraphs: [], bullets: [] } as StoryBlock;
      }

      let heading: string | undefined;
      const body = [...lines];
      if (body[0].endsWith(":")) {
        heading = body.shift();
      }

      const paragraphs: string[] = [];
      const bullets: string[] = [];

      for (const line of body) {
        if (line.startsWith("- ")) {
          bullets.push(line.slice(2).trim());
        } else {
          paragraphs.push(line);
        }
      }

      return { heading, paragraphs, bullets };
    })
    .filter((block) => block.heading || block.paragraphs.length > 0 || block.bullets.length > 0);
}

export default function WorldNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/world-news", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Unable to load world news");
        }

        const data = await res.json();
        if (!cancelled) {
          setItems((data.items ?? []) as NewsItem[]);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load world headlines right now.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const featured = useMemo(() => items[0], [items]);
  const rest = useMemo(() => items.slice(1, 20), [items]);
  const featuredBlocks = useMemo(
    () => parseStoryBlocks(featured?.fullArticle),
    [featured]
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Live World Newsroom</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm">
              <Link
                href="/news"
                className="rounded-full border border-foreground/15 bg-card px-3 py-1.5 font-medium text-foreground/70 transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
              >
                Market News
              </Link>
              <Link
                href="/news/world"
                className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1.5 font-medium text-brand-blue"
              >
                World News
              </Link>
            </div>
            <div className="rounded-full border border-foreground/10 px-3 py-2 text-sm text-foreground/60 w-fit">
              Google News feed, auto-refreshing every minute
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
        {loading ? (
          <p className="text-sm text-foreground/60">Loading world headlines…</p>
        ) : error ? (
          <p className="text-sm text-foreground/60">{error}</p>
        ) : featured ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/45">Top story</p>
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-xl border border-foreground/10 bg-background/60 p-4 hover:border-brand-blue/40 transition-colors"
              >
                <ArticleImage
                  key={featured.imageUrl || featured.url}
                  src={featured.imageUrl}
                  alt={featured.headline}
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                  fallbackSrc="/world-news-fallback.svg"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">{featured.source}</p>
                <h2 className="mt-2 text-xl font-semibold leading-snug">{featured.headline}</h2>
                {featuredBlocks.length > 0 ? (
                  <div className="mt-3 max-h-[26rem] space-y-3 overflow-y-auto rounded-lg border border-foreground/10 bg-background/50 p-3">
                    {featuredBlocks.map((block, index) => (
                      <div key={`${index}-${block.heading || block.paragraphs[0] || "section"}`} className="space-y-2">
                        {block.heading ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">{block.heading}</p>
                        ) : null}
                        {block.paragraphs.map((paragraph, paragraphIndex) => (
                          <p
                            key={`${index}-p-${paragraphIndex}-${paragraph.slice(0, 24)}`}
                            className="text-sm text-foreground/75 leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                        {block.bullets.length > 0 ? (
                          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/75 leading-relaxed">
                            {block.bullets.map((bullet, bulletIndex) => (
                              <li key={`${index}-b-${bulletIndex}-${bullet.slice(0, 24)}`}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : featured.description ? (
                  <div className="mt-3 rounded-lg border border-foreground/10 bg-background/50 p-3">
                    <p className="text-sm text-foreground/65 leading-relaxed">{featured.description}</p>
                    <p className="mt-2 text-xs text-foreground/45">
                      Full article preview unavailable from this publisher feed. Open source article for complete text.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-foreground/10 bg-background/50 p-3">
                    <p className="text-sm text-foreground/65 leading-relaxed">
                      Full article preview unavailable from this publisher feed. Open source article for complete text.
                    </p>
                  </div>
                )}
                <div className="mt-3 text-xs text-foreground/45">{formatRelative(featured.publishedAt)}</div>
              </a>
            </article>

            <article className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="text-base font-semibold">Latest world headlines</h3>
              <div style={{ maxHeight: "36rem", overflowY: "auto" }} className="mt-4 pr-2">
                <ul className="flex flex-col gap-3">
                  {rest.map((item, index) => (
                    <li key={`${item.url}-${index}`} className="flex items-start gap-3 border-b border-foreground/10 pb-3 last:border-none last:pb-0">
                      <ArticleImage
                        key={item.imageUrl || item.url}
                        src={item.imageUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                          {item.headline}
                        </a>
                        <div className="mt-1 flex items-center gap-2 text-xs text-foreground/45">
                          <span>{item.source}</span>
                          <span>·</span>
                          <span>{formatRelative(item.publishedAt)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        ) : (
          <p className="text-sm text-foreground/60">No world headlines available yet.</p>
        )}
      </section>

      <footer className="max-w-7xl mx-auto px-6 pb-10 pt-4">
        <SiteFooter
          note={
            <>
              World headlines are aggregated from Google News RSS and refreshed continuously.
              For personal use — not investment advice.
            </>
          }
        />
      </footer>
    </main>
  );
}
