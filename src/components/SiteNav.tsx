"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stocks" },
  { href: "/commodities", label: "Commodities" },
  { href: "/forex", label: "Forex" },
  { href: "/crypto", label: "Crypto" },
  { href: "/indices", label: "Indices" },
];

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const current = PAGES.find((p) => p.href === pathname)?.href ?? "/";

  return (
    <header className="border-b border-foreground/10">
      <div className="max-w-5xl w-full mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="w-6 h-6" />
          <span className="text-sm font-semibold tracking-tight">TradingNexus</span>
        </Link>
        <label className="flex items-center gap-2 text-xs text-foreground/50">
          Viewing
          <select
            value={current}
            onChange={(e) => router.push(e.target.value)}
            className="px-2 py-1 rounded border border-brand-blue/40 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            {PAGES.map((p) => (
              <option key={p.href} value={p.href}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
