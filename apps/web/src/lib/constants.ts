import {
  Brain,
  Bot,
  Lightbulb,
  Eye,
  Layers,
  Cpu,
  Gamepad2,
  Server,
  Database,
  Mic,
  Code2,
  Plug,
  Sparkles,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  slug: string;
  name: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { slug: "llms", name: "LLMs", color: "#6366f1", icon: Brain },
  { slug: "agents", name: "Agents", color: "#f59e0b", icon: Bot },
  { slug: "reasoning", name: "Reasoning", color: "#10b981", icon: Lightbulb },
  { slug: "vision", name: "Vision", color: "#3b82f6", icon: Eye },
  { slug: "multimodal", name: "Multimodal", color: "#8b5cf6", icon: Layers },
  { slug: "robotics", name: "Robotics", color: "#ef4444", icon: Cpu },
  { slug: "rl", name: "Reinforcement Learning", color: "#ec4899", icon: Gamepad2 },
  { slug: "infra", name: "Infrastructure", color: "#6b7280", icon: Server },
  { slug: "rag", name: "RAG", color: "#14b8a6", icon: Database },
  { slug: "speech", name: "Speech", color: "#f97316", icon: Mic },
  { slug: "coding", name: "Coding", color: "#84cc16", icon: Code2 },
  { slug: "mcp", name: "MCP", color: "#a78bfa", icon: Plug },
  { slug: "synth", name: "Synthetic Data", color: "#06b6d4", icon: Sparkles },
  { slug: "evals", name: "Evals", color: "#fbbf24", icon: ClipboardCheck },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

export function getCategory(slug: string | undefined | null): CategoryDef {
  if (slug && CATEGORY_MAP[slug]) return CATEGORY_MAP[slug];
  return { slug: slug || "unknown", name: slug || "Unknown", color: "#6b7280", icon: Layers };
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export const SORT_OPTIONS = [
  { value: "composite", label: "Composite Score" },
  { value: "impact", label: "Impact" },
  { value: "momentum", label: "Momentum" },
  { value: "innovation", label: "Innovation" },
  { value: "recent", label: "Most Recent" },
  { value: "citations", label: "Citations" },
];

export const MODEL_SORT_OPTIONS = [
  { value: "growth_score", label: "Growth" },
  { value: "popularity_score", label: "Popularity" },
  { value: "downloads_7d", label: "Downloads (7d)" },
  { value: "downloads_total", label: "Total Downloads" },
  { value: "likes", label: "Likes" },
];

export const MODEL_TYPES = [
  "text-generation",
  "text-to-image",
  "automatic-speech-recognition",
  "image-classification",
  "feature-extraction",
  "reinforcement-learning",
];
