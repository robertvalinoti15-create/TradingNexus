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

const DEFAULT_FOLLOW_UPS = [
  "Which sectors are leading today and why?",
  "What are the top market risks in the next week?",
  "What should I watch before the next market open?",
  "Give me a quick read on stocks vs crypto today.",
];

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1");
}

function formatAnswerBlocks(text: string): Array<{ type: "list" | "paragraph"; items: string[] }> {
  const lines = stripMarkdown(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: Array<{ type: "list" | "paragraph"; items: string[] }> = [];
  let listItems: string[] = [];

  for (const line of lines) {
    const isListLine = line.startsWith("- ") || line.startsWith("* ");

    if (isListLine) {
      listItems.push(line.slice(2).trim());
      continue;
    }

    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }

    blocks.push({ type: "paragraph", items: [line] });
  }

  if (listItems.length > 0) {
    blocks.push({ type: "list", items: listItems });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", items: ["No answer available yet."] }];
}

function buildFollowUps(query: string): string[] {
  const q = query.toLowerCase();

  if (!q) {
    return DEFAULT_FOLLOW_UPS;
  }

  if (q.includes("crypto") || q.includes("bitcoin") || q.includes("ethereum")) {
    return [
      "What is driving Bitcoin and Ethereum today?",
      "Which altcoins are showing unusual momentum?",
      "How is crypto correlating with tech stocks this week?",
      "What is the biggest near-term risk for crypto?",
    ];
  }

  if (q.includes("forex") || q.includes("dollar") || q.includes("eur") || q.includes("yen")) {
    return [
      "What is moving the US dollar right now?",
      "Which currency pairs look most volatile today?",
      "How are rates expectations affecting forex this week?",
      "What should I watch on the next macro calendar event?",
    ];
  }

  if (q.includes("stock") || q.includes("equity") || q.includes("index") || q.includes("market")) {
    return [
      "Which sectors are leading the market today?",
      "What is driving the S&P 500 and Nasdaq right now?",
      "Which earnings this week could move the market most?",
      "What are the top downside risks into next week?",
    ];
  }

  return DEFAULT_FOLLOW_UPS;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const [answer, setAnswer] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [answeredAt, setAnsweredAt] = useState<string>("");
  const followUps = useMemo(() => buildFollowUps(query), [query]);

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
      setAnswer("");
      setStatus("idle");
      setAnsweredAt("");
      return;
    }

    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch(`/api/search-ai?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!cancelled) {
          setAnswer(data.answer || "I couldn't generate an answer right now.");
          setStatus(response.ok ? "success" : "error");
          setAnsweredAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        }
      } catch {
        if (!cancelled) {
          setAnswer("I hit a temporary issue while contacting Groq. Please try again in a moment.");
          setStatus("error");
          setAnsweredAt("");
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
      <section className="border-b border-foreground/10 bg-gradient-to-b from-brand-blue/5 to-transparent">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AI Search</h1>
          <p className="text-sm text-foreground/60">
            {query ? `Answering your question about “${query}”.` : "Ask a natural-language question and get a direct answer."}
          </p>
          {query ? (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-foreground/70">
              <span className="rounded-full border border-foreground/15 bg-card px-3 py-1">Model: Llama 3.3 70B</span>
              <span className="rounded-full border border-foreground/15 bg-card px-3 py-1">Mode: Live market assistant</span>
              {answeredAt ? <span className="rounded-full border border-foreground/15 bg-card px-3 py-1">Updated at {answeredAt}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10">
        {query ? (
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Answer</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === "loading"
                    ? "bg-foreground/10 text-foreground/70"
                    : status === "error"
                      ? "bg-brand-red/10 text-brand-red"
                      : "bg-brand-blue/10 text-brand-blue"
                }`}
              >
                {status === "loading" ? "Generating" : status === "error" ? "Needs retry" : "Live answer"}
              </span>
            </div>

            {status === "loading" ? (
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-foreground/10" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-foreground/10" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-foreground/10" />
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
                {formatAnswerBlocks(answer).map((block, index) =>
                  block.type === "list" ? (
                    <ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
                      {block.items.map((item, itemIndex) => (
                        <li key={`list-item-${index}-${itemIndex}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={`paragraph-${index}`}>{block.items[0]}</p>
                  )
                )}
              </div>
            )}

            {status !== "loading" ? (
              <div className="mt-6 border-t border-foreground/10 pt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground/60">Ask a follow-up</p>
                <div className="flex flex-wrap gap-2">
                  {followUps.map((question) => (
                    <Link
                      key={question}
                      href={`/search?q=${encodeURIComponent(question)}`}
                      className="rounded-full border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-brand-blue/50 hover:bg-brand-blue/5"
                    >
                      {question}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Related sections</h2>
          <div className="mt-4 flex flex-col gap-3">
            {results.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-foreground/10 bg-background/40 p-4 transition-colors hover:border-brand-blue/50 hover:bg-brand-blue/5"
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
