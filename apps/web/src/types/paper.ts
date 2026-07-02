export interface CategoryRef {
  slug: string;
  name: string;
  color: string;
}

export interface AuthorRef {
  name: string;
  id?: string;
}

export interface PaperScores {
  composite: number;
  impact: number;
  momentum: number;
  innovation: number;
}

export interface PaperMetricsData {
  citations: number;
  github_impls: number;
  hf_models: number;
  social_mentions: number;
}

export interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  abstract_snippet: string;
  published_at: string;
  primary_category: CategoryRef;
  authors: AuthorRef[];
  scores: PaperScores;
  metrics: PaperMetricsData;
  has_ai_summary: boolean;
}

export interface AISummary {
  core_contribution: string;
  key_innovation: string;
  problem_solved: string;
  practical_applications: string[];
  limitations: string[];
  significance: string;
  significance_rationale: string;
  related_concepts: string[];
}

export interface PaperDetail extends Paper {
  ai_summary?: AISummary | null;
  org_name?: string | null;
}

export interface MetricsHistoryPoint {
  recorded_at: string;
  citation_count: number;
  github_impl_count: number;
  hf_model_count: number;
  impact_score: number;
  momentum_score: number;
}

export interface Pagination {
  cursor: string | null;
  has_more: boolean;
  total_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
