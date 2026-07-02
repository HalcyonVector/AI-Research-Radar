import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  variant?: "solid" | "soft" | "outline";
}

export function Badge({ className, color, variant = "soft", style, children, ...props }: BadgeProps) {
  const styles: React.CSSProperties = { ...style };
  if (color) {
    if (variant === "soft") {
      styles.backgroundColor = `${color}22`;
      styles.color = color;
      styles.borderColor = `${color}44`;
    } else if (variant === "solid") {
      styles.backgroundColor = color;
      styles.color = "#fff";
    } else {
      styles.color = color;
      styles.borderColor = `${color}66`;
    }
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        !color && "border-[var(--border-base)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
        className
      )}
      style={styles}
      {...props}
    >
      {children}
    </span>
  );
}
