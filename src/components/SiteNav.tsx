"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stocks" },
  { href: "/commodities", label: "Commodities" },
  { href: "/forex", label: "Forex" },
  { href: "/crypto", label: "Crypto" },
  { href: "/indices", label: "Indices" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-foreground/10">
      <div className="h-1 bg-gradient-to-r from-brand-blue to-brand-red" />
      <div className="max-w-5xl w-full mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="w-6 h-6" />
          <span className="text-sm font-semibold tracking-tight">TradingNexus</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
          {PAGES.map((p) => {
            const isActive = pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                className={`px-2 py-1 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-brand-blue" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
