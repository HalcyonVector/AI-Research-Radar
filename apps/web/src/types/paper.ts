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

// ── Chat ────────────────────────────────────────────────────────────────
export interface ChatSource {
  id: string;
  title: string;
  arxiv_id: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

// ── Authors & Organizations ─────────────────────────────────────────────
export interface OrgRef {
  id: string;
  name: string;
}

export interface Author {
  id: string;
  name: string;
  organization: OrgRef | null;
  paper_count: number;
  citation_count: number;
  h_index: number;
  papers: Paper[];
}

export interface OrgTopAuthor {
  id: string;
  name: string;
  paper_count: number;
}

export interface Organization {
  id: string;
  name: string;
  org_type: string;
  country: string;
  paper_count: number;
  papers: Paper[];
  top_authors: OrgTopAuthor[];
}

// ── Compare ─────────────────────────────────────────────────────────────
export interface CompareDnaEntry {
  concept: string;
  weight: number;
  rationale: string;
}

export interface CompareResponse {
  papers: PaperDetail[];
  dna: Record<string, CompareDnaEntry[]>;
}

// ── Bookmarks & Watches ─────────────────────────────────────────────────
export interface Bookmark {
  id: string;
  entity_type: string;
  entity_id: string;
  note?: string | null;
  created_at: string;
}

export interface Watch {
  id: string;
  label: string;
  query?: string | null;
  category_slug?: string | null;
  created_at: string;
}

export interface WatchDigest {
  data: Paper[];
}
