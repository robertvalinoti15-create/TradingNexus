type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function StocksIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 20h18" />
      <path d="M3 16l5-6 4 3 8-9" />
      <path d="M15 4h5v5" />
    </svg>
  );
}

export function CommoditiesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l7 3.5v11L12 21l-7-3.5v-11z" />
      <path d="M5 6.5L12 10l7-3.5" />
      <path d="M12 10v11" />
    </svg>
  );
}

export function ForexIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8h14" />
      <path d="M14 4l4 4-4 4" />
      <path d="M20 16H6" />
      <path d="M10 12l-4 4 4 4" />
    </svg>
  );
}

export function CryptoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8h3.5a2 2 0 010 4H10m0 0h3.5a2 2 0 010 4H10m0-8v8m0-8V6m0 10v2" />
    </svg>
  );
}

export function IndicesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.4 2.8 15.6 0 18" />
      <path d="M12 3c-2.8 2.4-2.8 15.6 0 18" />
    </svg>
  );
}
