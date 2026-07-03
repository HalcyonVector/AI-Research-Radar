import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/formatters";

interface GrowthBadgeProps {
  value: number;
  suffix?: string;
  className?: string;
  size?: "sm" | "md";
}

// Mono growth indicator: typographic arrow + tabular value.
// Positive reads bright, negative reads dim — lightness, not hue.
export function GrowthBadge({ value, suffix = "", className, size = "sm" }: GrowthBadgeProps) {
  const positive = value > 0;
  const neutral = value === 0;
  const arrow = neutral ? "→" : positive ? "▲" : "▼";
  const color = positive ? "var(--text-primary)" : "var(--text-tertiary)";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      style={{ color }}
    >
      <span className="text-[0.8em] leading-none">{arrow}</span>
      {formatDelta(value)}
      {suffix}
    </span>
  );
}
