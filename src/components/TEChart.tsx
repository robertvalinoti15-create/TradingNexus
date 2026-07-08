"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

export function TEChart({
  symbol,
  path,
  tvSymbol,
}: {
  symbol: string;
  path: string;
  tvSymbol?: string;
}) {
  const theme = useColorScheme();

  if (tvSymbol) {
    return (
      <TradingViewWidget
        scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
        height={420}
        config={{
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme,
          style: "1",
          locale: "en",
          allow_symbol_change: false,
          hide_side_toolbar: false,
          support_host: "https://www.tradingview.com",
        }}
      />
    );
  }

  // No vetted TradingView symbol for this one — fall back to
  // TradingEconomics' static (but frequently refreshed) snapshot image
  // rather than risk an unresolved/blank interactive widget.
  const imgUrl = `https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=${encodeURIComponent(
    symbol
  )}&h=300&w=800`;

  return (
    <a
      href={`https://tradingeconomics.com${path}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-foreground/10 rounded-lg overflow-hidden bg-black/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgUrl} alt={`${symbol} price chart`} className="w-full h-auto block" />
    </a>
  );
}
