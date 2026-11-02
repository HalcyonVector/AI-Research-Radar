import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/formatters";

interface GrowthBadgeProps {
  value: number | null;
  suffix?: string;
  className?: string;
  size?: "sm" | "md";
}

// Mono growth indicator: typographic arrow + tabular value.
// Positive reads bright, negative reads dim — lightness, not hue.
export function GrowthBadge({ value, suffix = "", className, size = "sm" }: GrowthBadgeProps) {
  // null = no prior snapshot to diff against yet, not a computed zero.
  if (value === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium tabular-nums text-[var(--text-tertiary)]",
          size === "sm" ? "text-xs" : "text-sm",
          className
        )}
        title="Not enough history yet to compute a week-over-week trend"
      >
        <span className="text-[0.8em] leading-none">·</span>
        new
      </span>
    );
  }

  const positive = value > 0;
  const neutral = value === 0;
  const arrow = neutral ? "→" : positive ? "▲" : "▼";
  const color = positive ? "var(--text-primary)" : "var(--text-tertiary)";
  // Growth scores are clamped to ±100, so a value there means "at least this
  // much" rather than an exact figure.
  const capped = Math.abs(value) >= 100;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      style={{ color }}
      title={capped ? "Off the scale: growth scores are capped at ±100" : undefined}
    >
      <span className="text-[0.8em] leading-none">{arrow}</span>
      {capped ? "100+" : formatDelta(value)}
      {suffix}
    </span>
  );
}
