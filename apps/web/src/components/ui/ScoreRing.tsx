"use client";

import { useEffect, useState } from "react";
import { scoreColor } from "@/lib/constants";
import { formatScore } from "@/lib/formatters";

interface ScoreRingProps {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  showValue?: boolean;
  animate?: boolean;
}

export function ScoreRing({
  score,
  size = 72,
  stroke = 6,
  label,
  showValue = true,
  animate = true,
}: ScoreRingProps) {
  const safe = Math.max(0, Math.min(100, score ?? 0));
  const [display, setDisplay] = useState(animate ? 0 : safe);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(safe);

  useEffect(() => {
    if (!animate) {
      setDisplay(safe);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(safe * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safe, animate]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-base)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: animate ? "none" : "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-mono font-semibold tabular-nums"
              style={{ fontSize: size * 0.28, color }}
            >
              {formatScore(display)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          {label}
        </span>
      )}
    </div>
  );
}
