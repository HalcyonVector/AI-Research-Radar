import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/formatters";

interface GrowthBadgeProps {
  value: number;
  suffix?: string;
  className?: string;
  size?: "sm" | "md";
}

export function GrowthBadge({ value, suffix = "", className, size = "sm" }: GrowthBadgeProps) {
  const positive = value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  const color = neutral ? "#6b7280" : positive ? "#22c55e" : "#ef4444";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium tabular-nums",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      style={{ color, backgroundColor: `${color}18`, borderColor: `${color}33` }}
    >
      <Icon size={size === "sm" ? 11 : 13} />
      {formatDelta(value)}
      {suffix}
    </span>
  );
}
