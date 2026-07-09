"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-3 sm:flex-row">
      <label htmlFor="site-search" className="sr-only">
        Search the site
      </label>
      <input
        id="site-search"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search markets, news, stocks, crypto..."
        className="w-full rounded-full border border-foreground/10 bg-background/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-foreground/40 focus:border-brand-blue"
      />
      <button
        type="submit"
        className="rounded-full bg-brand-blue px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
