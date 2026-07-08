"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

export function StockChart({ tvSymbol }: { tvSymbol: string }) {
  const theme = useColorScheme();

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
