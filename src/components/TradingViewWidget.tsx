"use client";

import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  scriptSrc: string;
  config: Record<string, unknown>;
  height?: number | string;
  className?: string;
}

// Generic embed for TradingView's free widgets (Advanced Chart, Timeline,
// Hotlists, ...). These all follow the same pattern: a container div plus a
// <script> tag whose text content is a JSON config, loaded from
// s3.tradingview.com. There's no JS API to read data back out of them.
//
// Widgets configured with autosize (the chart) rewrite their own container's
// inline style to height:100%/width:100%, so the pixel height has to live on
// an outer wrapper that TradingView's script never touches.
export function TradingViewWidget({ scriptSrc, config, height = 400, className }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.text = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptSrc, JSON.stringify(config)]);

  return (
    <div className={className} style={{ height, width: "100%" }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
