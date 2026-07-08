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
  Network,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  slug: string;
  name: string;
  color: string;
  icon: LucideIcon;
}

// Slugs/names/colors must match the real backend-seeded ResearchCategory rows
// (see infra/scripts/seed_categories.py) — this list previously used made-up
// slugs like "reasoning"/"agents"/"coding" that matched nothing, silently
// breaking category-seeded features (Graph page, search filters) for 12 of 14
// categories even though the categories themselves had plenty of real data.
export const CATEGORIES: CategoryDef[] = [
  { slug: "llms", name: "LLMs", color: "#6366f1", icon: Brain },
  { slug: "reasoning-models", name: "Reasoning Models", color: "#10b981", icon: Lightbulb },
  { slug: "ai-agents", name: "AI Agents", color: "#f59e0b", icon: Bot },
  { slug: "coding-agents", name: "Coding Agents", color: "#84cc16", icon: Code2 },
  { slug: "robotics", name: "Robotics", color: "#ef4444", icon: Cpu },
  { slug: "computer-vision", name: "Computer Vision", color: "#3b82f6", icon: Eye },
  { slug: "speech-ai", name: "Speech AI", color: "#f97316", icon: Mic },
  { slug: "ai-infrastructure", name: "AI Infrastructure", color: "#6b7280", icon: Server },
  { slug: "rag-systems", name: "RAG Systems", color: "#14b8a6", icon: Database },
  { slug: "multi-agent-systems", name: "Multi-Agent Systems", color: "#eab308", icon: Network },
  { slug: "multimodal-ai", name: "Multimodal AI", color: "#8b5cf6", icon: Layers },
  { slug: "reinforcement-learning", name: "Reinforcement Learning", color: "#ec4899", icon: Gamepad2 },
  { slug: "synthetic-data", name: "Synthetic Data", color: "#06b6d4", icon: Sparkles },
  { slug: "mcp-ecosystem", name: "MCP Ecosystem", color: "#a78bfa", icon: Plug },
  { slug: "evaluation-frameworks", name: "Evaluation Frameworks", color: "#fbbf24", icon: ClipboardCheck },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

export function getCategory(slug: string | undefined | null): CategoryDef {
  if (slug && CATEGORY_MAP[slug]) return CATEGORY_MAP[slug];
  return { slug: slug || "unknown", name: slug || "Unknown", color: "#6b7280", icon: Layers };
}

// Mono ramp — lightness encodes score (brutalist B/W system).
export function scoreColor(score: number): string {
  if (score >= 80) return "#ffffff";
  if (score >= 60) return "#cfcfcf";
  if (score >= 40) return "#8a8a8a";
  return "#565656";
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
