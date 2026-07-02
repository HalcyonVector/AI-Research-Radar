"use client";

import { Badge } from "@/components/ui/Badge";
import { scoreColor } from "@/lib/constants";
import { formatScore, truncate } from "@/lib/formatters";
import type { GraphNode } from "@/types/graph";

interface NodeTooltipProps {
  node: GraphNode | null;
  x: number;
  y: number;
  visible: boolean;
}

export function NodeTooltip({ node, x, y, visible }: NodeTooltipProps) {
  if (!visible || !node) return null;

  const hasScore = typeof node.score === "number" && !Number.isNaN(node.score);

  return (
    <div
      className="pointer-events-none absolute z-30 max-w-[220px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur"
      style={{
        left: x,
        top: y,
        transform: "translate(14px, -50%)",
      }}
    >
      <p className="text-xs font-semibold leading-snug text-[var(--text-primary)]">
        {truncate(node.label, 60)}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <Badge className="capitalize">{node.type}</Badge>
        {hasScore && (
          <span
            className="font-mono text-xs font-semibold tabular-nums"
            style={{ color: scoreColor(node.score as number) }}
          >
            {formatScore(node.score)}
          </span>
        )}
      </div>
    </div>
  );
}
