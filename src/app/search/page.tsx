"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";

const SEARCH_TARGETS = [
  { href: "/stocks", label: "Stocks", description: "Track stock quotes and company pages." },
  { href: "/commodities", label: "Commodities", description: "Explore commodities, energy, and metals." },
  { href: "/forex", label: "Forex", description: "Browse foreign exchange pairs and market data." },
  { href: "/crypto", label: "Crypto", description: "See crypto prices, charts, and market movers." },
  { href: "/indices", label: "Indices", description: "Compare major stock market indexes." },
  { href: "/news", label: "News", description: "Open the live market news feed." },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const results = useMemo(() => {
    if (!query) {
      return SEARCH_TARGETS;
    }

    const needle = query.toLowerCase();
    return SEARCH_TARGETS.filter((item) => {
      const haystack = `${item.label} ${item.description} ${item.href}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query]);

  useEffect(() => {
    if (!query) {
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/search-ai?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!cancelled) {
          setAnswer(data.answer || "I couldn't generate an answer right now.");
        }
      } catch {
        if (!cancelled) {
          setAnswer("I hit a temporary issue while contacting Google AI. Please try again in a moment.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-12">
          <h1 className="text-3xl font-semibold tracking-tight">AI Search</h1>
          <p className="text-sm text-foreground/60">
            {query ? `Answering your question about “${query}”.` : "Ask a natural-language question and get a direct answer."}
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10">
        {query ? (
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Answer</h2>
            <div className="mt-3 text-sm leading-relaxed text-foreground/70">
              {loading ? "Generating an answer…" : answer || "No answer available yet."}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Related sections</h2>
          <div className="mt-4 flex flex-col gap-3">
            {results.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-foreground/10 p-4 transition-colors hover:border-brand-blue/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-1 text-sm text-foreground/60">{item.description}</p>
                  </div>
                  <span className="text-sm font-medium text-brand-blue">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 pb-10">
        <SiteFooter note={<>Search across the main market pages and live news with AI answers.</>} />
      </footer>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}> 
      <SearchPageContent />
    </Suspense>
  );
}
