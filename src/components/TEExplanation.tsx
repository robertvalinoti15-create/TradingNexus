"use client";

import { useWikipediaSummary } from "@/lib/useWikipediaSummary";

export function TEExplanation({ name }: { name: string }) {
  const { summary, status } = useWikipediaSummary(name);
  const investopediaUrl = `https://www.investopedia.com/search?q=${encodeURIComponent(name)}`;

  if (status === "loading") {
    return <p className="text-sm text-foreground/50">Loading overview...</p>;
  }

  if (status === "error" || !summary) {
    return (
      <p className="text-sm text-foreground/50">
        Couldn&apos;t load an overview for {name}.{" "}
        <a
          href={investopediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline"
        >
          Search Investopedia →
        </a>
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
        <div className="flex gap-3 mt-1">
          <a
            href={summary.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-blue hover:underline inline-block"
          >
            Read more on Wikipedia →
          </a>
          <a
            href={investopediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-blue hover:underline inline-block"
          >
            Search Investopedia →
          </a>
        </div>
      </div>
    </div>
  );
}
