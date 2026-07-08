// Decorative candlestick silhouette for the hero section. Purely
// illustrative — not real data — kept low-opacity so it reads as texture
// rather than a chart someone might mistake for actual market data.
const BARS: { h: number; up: boolean }[] = [
  { h: 30, up: true },
  { h: 45, up: false },
  { h: 25, up: true },
  { h: 55, up: true },
  { h: 40, up: false },
  { h: 60, up: true },
  { h: 35, up: false },
  { h: 70, up: true },
  { h: 50, up: false },
  { h: 65, up: true },
  { h: 80, up: true },
  { h: 55, up: false },
  { h: 90, up: true },
  { h: 70, up: false },
  { h: 100, up: true },
  { h: 75, up: false },
  { h: 110, up: true },
  { h: 85, up: false },
  { h: 95, up: true },
  { h: 120, up: true },
  { h: 100, up: false },
  { h: 130, up: true },
  { h: 105, up: false },
  { h: 140, up: true },
];

export function HeroChartBackground({ className }: { className?: string }) {
  const width = 1200;
  const height = 200;
  const gap = width / BARS.length;
  const barWidth = gap * 0.45;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {BARS.map((bar, i) => {
        const x = i * gap + gap * 0.25;
        const y = height - bar.h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={bar.h}
            rx={2}
            className={bar.up ? "fill-brand-blue" : "fill-brand-red"}
            opacity={0.25}
          />
        );
      })}
    </svg>
  );
}
