"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

export function MarketMovers() {
  const theme = useColorScheme();

  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js"
      height={520}
      config={{
        colorTheme: theme,
        dateRange: "12M",
        exchange: "US",
        showChart: true,
        locale: "en",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: 520,
      }}
    />
  );
}
