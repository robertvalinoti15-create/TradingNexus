import Link from "next/link";
import { HeroChartBackground } from "@/components/HeroChartBackground";
import {
  StocksIcon,
  CommoditiesIcon,
  ForexIcon,
  CryptoIcon,
  IndicesIcon,
} from "@/components/MarketIcons";

const MARKETS = [
  {
    href: "/stocks",
    label: "Stocks",
    description: "Build a watchlist, track your portfolio's value, and see what's moving it.",
    Icon: StocksIcon,
  },
  {
    href: "/commodities",
    label: "Commodities",
    description: "Energy, metals, and agriculture — real prices, not delayed guesses.",
    Icon: CommoditiesIcon,
  },
  {
    href: "/forex",
    label: "Forex",
    description: "Major and regional currency pairs, from EUR/USD to the long tail.",
    Icon: ForexIcon,
  },
  {
    href: "/crypto",
    label: "Crypto",
    description: "Bitcoin, Ether, and the rest — priced and charted like everything else.",
    Icon: CryptoIcon,
  },
  {
    href: "/indices",
    label: "Indices",
    description: "S&P 500, Dow, Nasdaq, and world markets in one comparable view.",
    Icon: IndicesIcon,
  },
];

const VALUE_PROPS = [
  {
    title: "Live, not simulated",
    body: "Prices, charts, and news sourced directly from the market and refreshed continuously — never mocked data dressed up to look real.",
  },
  {
    title: "Every asset class, one roof",
    body: "Stocks, commodities, forex, crypto, and world indices, all built on the same standard so you can actually compare them.",
  },
  {
    title: "Context, not just numbers",
    body: "Every chart comes with a plain-language explanation of what you're looking at and the news actually behind the move.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden border-b border-foreground/10">
        <HeroChartBackground className="absolute inset-x-0 bottom-0 w-full h-40 sm:h-56" />
        <div className="relative max-w-5xl w-full mx-auto px-6 pt-20 pb-28 flex flex-col items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="w-14 h-14" />
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">TradingNexus</h1>
          <p className="text-lg text-foreground/70 max-w-2xl leading-relaxed">
            Every market you actually care about, in one place — stocks, commodities, forex,
            crypto, and world indices — with live prices, real charts, honest explanations, and
            the news actually moving them. No paywalls, no noise, no simulated data.
          </p>
          <Link
            href="/stocks"
            className="px-5 py-2.5 rounded bg-brand-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Explore the markets →
          </Link>
        </div>
      </section>

      <section className="max-w-5xl w-full mx-auto px-6 py-16 flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold">Markets</h2>
          <p className="text-sm text-foreground/50 mt-1">Pick a market to start tracking it.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKETS.map(({ href, label, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group border border-foreground/10 rounded-xl p-5 flex flex-col gap-3 hover:border-brand-blue/50 transition-colors"
            >
              <Icon className="w-7 h-7 text-brand-blue" />
              <div>
                <h3 className="font-medium flex items-center gap-1.5">
                  {label}
                  <span className="text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </h3>
                <p className="text-sm text-foreground/60 mt-1 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="max-w-5xl w-full mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title}>
              <h3 className="font-medium">{prop.title}</h3>
              <p className="text-sm text-foreground/60 mt-2 leading-relaxed">{prop.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-5xl w-full mx-auto px-6 pb-10 text-xs text-foreground/30">
        Data via Yahoo Finance, TradingEconomics.com, TradingView, Wikipedia, Investopedia, and
        SEC EDGAR. For personal use — not investment advice.
      </footer>
    </main>
  );
}
