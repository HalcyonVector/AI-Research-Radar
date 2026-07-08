import type { CategoryRef, Paper } from "./paper";

export interface TrendScores {
  // null when there isn't yet enough ingestion history to compute a
  // meaningful week-over-week ratio — distinct from a real, computed 0.
  growth: number | null;
  momentum: number | null;
  activity: number;
  adoption: number;
}

export interface TrendDelta {
  // null when there's no prior weekly snapshot yet to diff against (new
  // category, or the app hasn't been running long enough) — distinct from a
  // real, computed 0% (genuinely flat week-over-week).
  growth: number | null;
  momentum: number | null;
}

export interface Trend {
  category: CategoryRef;
  scores: TrendScores;
  delta_7d: TrendDelta;
  papers_7d: number;
  models_7d: number;
  top_papers: Paper[];
  sparkline: number[];
}

export interface TrendsResponse {
  data: Trend[];
  generated_at: string;
}

export interface TrendHistoryPoint {
  recorded_at: string;
  growth: number | null;
  momentum: number | null;
  activity: number;
  adoption: number;
}
