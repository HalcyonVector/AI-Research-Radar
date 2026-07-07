import type { Pagination } from "./paper";

export interface Model {
  id: string;
  hf_model_id: string;
  name: string;
  description: string;
  model_type: string;
  downloads_7d: number;
  downloads_30d: number;
  downloads_total: number;
  likes: number;
  growth_score: number;
  popularity_score: number;
  linked_paper_id: string | null;
}

export interface ModelHistoryPoint {
  recorded_at: string;
  downloads_total: number;
  downloads_7d: number;
  likes: number;
}

export interface ModelListResponse {
  data: Model[];
  pagination: Pagination;
}
