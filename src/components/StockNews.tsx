"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import { useColorScheme } from "@/lib/useColorScheme";

export function StockNews({ tvSymbol }: { tvSymbol: string }) {
  const theme = useColorScheme();

  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
      height={420}
      config={{
        feedMode: "symbol",
        symbol: tvSymbol,
        colorTheme: theme,
        isTransparent: true,
        displayMode: "regular",
        width: "100%",
        height: 420,
        locale: "en",
      }}
    />
  );
}
