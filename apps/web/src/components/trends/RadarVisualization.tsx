"use client";

import { useEffect, useMemo, useState } from "react";
import type { Trend } from "@/types/trend";
import { getCategory } from "@/lib/constants";
import { formatScore } from "@/lib/formatters";

interface RadarVisualizationProps {
  trends: Trend[];
  onSelectCategory?: (slug: string) => void;
}

const SIZE = 500;
const CENTER = 250;
const MAX_RADIUS = 180;
const RINGS = [25, 50, 75, 100];

interface Axis {
  slug: string;
  name: string;
  color: string;
  growth: number;
  angle: number;
  vx: number;
  vy: number;
  lx: number;
  ly: number;
}

function polar(angle: number, radius: number) {
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

export function RadarVisualization({ trends, onSelectCategory }: RadarVisualizationProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const axes = useMemo<Axis[]>(() => {
    const list = (trends ?? [])
      .filter((t) => t?.category?.slug)
      .slice()
      .sort((a, b) => (b.scores?.growth ?? 0) - (a.scores?.growth ?? 0))
      .slice(0, 8);

    const n = list.length;
    return list.map((t, i) => {
      const def = getCategory(t.category.slug);
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const growth = Math.max(0, Math.min(100, t.scores?.growth ?? 0));
      const radius = (growth / 100) * MAX_RADIUS;
      const vertex = polar(angle, radius);
      const label = polar(angle, MAX_RADIUS + 26);
      return {
        slug: t.category.slug,
        name: t.category.name || def.name,
        color: t.category.color || def.color,
        growth,
        angle,
        vx: vertex.x,
        vy: vertex.y,
        lx: label.x,
        ly: label.y,
      };
    });
  }, [trends]);

  if (axes.length < 3) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-[var(--text-tertiary)]">
        Not enough trend data to render the radar.
      </div>
    );
  }

  const polygonPoints = axes.map((a) => `${a.vx.toFixed(1)},${a.vy.toFixed(1)}`).join(" ");
  const hoveredAxis = axes.find((a) => a.slug === hovered) ?? null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block w-full max-w-[520px]"
        role="img"
        aria-label="Category growth radar"
      >
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* concentric grid rings */}
        {RINGS.map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={(r / 100) * MAX_RADIUS}
            fill="none"
            stroke="var(--border-base)"
            strokeWidth={1}
            strokeDasharray={r === 100 ? undefined : "3 4"}
            opacity={0.7}
          />
        ))}

        {/* axis lines + labels */}
        {axes.map((a) => {
          const end = polar(a.angle, MAX_RADIUS);
          const active = hovered === a.slug;
          return (
            <g key={a.slug}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                stroke={active ? a.color : "var(--border-base)"}
                strokeWidth={active ? 1.5 : 1}
                opacity={active ? 0.9 : 0.6}
              />
              <text
                x={a.lx}
                y={a.ly}
                textAnchor={a.lx > CENTER + 4 ? "start" : a.lx < CENTER - 4 ? "end" : "middle"}
                dominantBaseline="middle"
                className="cursor-pointer select-none text-[11px] font-medium"
                fill={active ? a.color : "var(--text-tertiary)"}
                onMouseEnter={() => setHovered(a.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectCategory?.(a.slug)}
              >
                {a.name}
              </text>
            </g>
          );
        })}

        {/* growth polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radar-fill)"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.6)",
            transformOrigin: "center",
            transition: "opacity 0.6s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        />

        {/* vertex dots */}
        {axes.map((a) => {
          const active = hovered === a.slug;
          return (
            <circle
              key={a.slug}
              cx={a.vx}
              cy={a.vy}
              r={active ? 7 : 4.5}
              fill={a.color}
              stroke="var(--bg-surface)"
              strokeWidth={2}
              className="cursor-pointer"
              style={{
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.5s ease 0.3s, r 0.15s ease",
              }}
              onMouseEnter={() => setHovered(a.slug)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory?.(a.slug)}
            />
          );
        })}
      </svg>

      {/* tooltip */}
      {hoveredAxis && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg"
          style={{
            left: `${(hoveredAxis.vx / SIZE) * 100}%`,
            top: `${(hoveredAxis.vy / SIZE) * 100}%`,
            marginTop: -10,
          }}
        >
          <p className="text-xs font-semibold text-[var(--text-primary)]">{hoveredAxis.name}</p>
          <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: hoveredAxis.color }}>
            Growth {formatScore(hoveredAxis.growth)}
          </p>
        </div>
      )}
    </div>
  );
}
