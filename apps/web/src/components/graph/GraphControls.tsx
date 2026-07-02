"use client";

import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { NODE_TYPE_COLORS } from "./graphColors";

interface GraphControlsProps {
  depth: number;
  onDepthChange: (n: number) => void;
  edgeTypes: string[];
  activeEdgeTypes: string[];
  onToggleEdgeType: (t: string) => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  nodeCount: number;
  edgeCount: number;
}

const DEPTHS = [1, 2, 3];

const LEGEND: { type: string; label: string }[] = [
  { type: "paper", label: "Paper" },
  { type: "model", label: "Model" },
  { type: "author", label: "Author" },
  { type: "category", label: "Category" },
  { type: "org", label: "Org" },
  { type: "concept", label: "Concept" },
];

export function GraphControls({
  depth,
  onDepthChange,
  edgeTypes,
  activeEdgeTypes,
  onToggleEdgeType,
  onReset,
  onZoomIn,
  onZoomOut,
  nodeCount,
  edgeCount,
}: GraphControlsProps) {
  return (
    <div className="absolute left-3 top-3 z-20 w-52 select-none rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)]/90 p-3 shadow-lg shadow-black/30 backdrop-blur">
      {/* Depth */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          Depth
        </p>
        <div className="flex gap-1">
          {DEPTHS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDepthChange(d)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                depth === d
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border-base)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Edge type filters */}
      {edgeTypes.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Relations
          </p>
          <div className="flex flex-wrap gap-1">
            {edgeTypes.map((t) => {
              const active = activeEdgeTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleEdgeType(t)}
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors",
                    active
                      ? "border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/15 text-[var(--text-primary)]"
                      : "border-[var(--border-base)] bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {t.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Zoom + reset */}
      <div className="mb-3 flex items-center gap-1.5">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onZoomIn} aria-label="Zoom in">
          <ZoomIn size={15} />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onZoomOut} aria-label="Zoom out">
          <ZoomOut size={15} />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onReset} aria-label="Reset view">
          <RotateCcw size={15} />
        </Button>
      </div>

      {/* Legend */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          Node types
        </p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {LEGEND.map((l) => (
            <div key={l.type} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[l.type] }}
              />
              <span className="truncate text-[10px] text-[var(--text-secondary)]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center justify-between border-t border-[var(--border-base)] pt-2 text-[10px] text-[var(--text-tertiary)]">
        <span>
          <span className="font-mono font-semibold text-[var(--text-secondary)]">{nodeCount}</span> nodes
        </span>
        <span>
          <span className="font-mono font-semibold text-[var(--text-secondary)]">{edgeCount}</span> edges
        </span>
      </div>
    </div>
  );
}
