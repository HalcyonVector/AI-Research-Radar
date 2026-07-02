import { getCategory } from "@/lib/constants";
import type { GraphNode } from "@/types/graph";

export const NODE_TYPE_COLORS: Record<string, string> = {
  paper: "#6366f1",
  model: "#f59e0b",
  author: "#10b981",
  category: "#8b5cf6",
  org: "#ec4899",
  concept: "#14b8a6",
};

export const DEFAULT_NODE_COLOR = "#6b7280";

/** Resolve a display color for a node: prefer its category color, fall back to type color. */
export function nodeColor(node: GraphNode): string {
  if (node.category) {
    const cat = getCategory(node.category);
    if (cat && cat.color) return cat.color;
  }
  return NODE_TYPE_COLORS[node.type] ?? DEFAULT_NODE_COLOR;
}

/** Radius scaled by score, clamped to a sensible range. */
export function nodeRadius(node: GraphNode): number {
  const score = typeof node.score === "number" && !Number.isNaN(node.score) ? node.score : 0;
  return Math.max(6, 6 + (Math.max(0, Math.min(100, score)) / 100) * 10);
}
