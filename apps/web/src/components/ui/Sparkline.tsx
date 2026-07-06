"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}

/**
 * Lightweight self-contained SVG sparkline (no recharts dependency for tiny charts).
 */
export function Sparkline({
  data,
  width = 100,
  height = 28,
  color,
  fill = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  // Mono system: sparklines are always white on faint fill (color prop ignored).
  void color;
  const stroke = "var(--text-primary)";
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="opacity-40" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const flat = max === min; // all-equal (e.g. all-zero) trend
  const span = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * stepX;
    // Center a flat line vertically so it lines up with the growth number beside it,
    // instead of sinking to the bottom of the box.
    const y = flat ? height / 2 : height - ((v - min) / span) * (height - 2) - 1;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
