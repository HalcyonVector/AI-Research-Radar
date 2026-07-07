import type { CategoryRef } from "./paper";

export interface SleepingGiant {
  paper: {
    id: string;
    arxiv_id: string;
    title: string;
    citation_count: number;
  };
  emerging_breakthrough_score: number;
  breakthrough_driver: string;
  driver_detail: string;
  ai_rationale: string;
  computed_at: string;
}

export interface SleepingGiantsResponse {
  data: SleepingGiant[];
  generated_at: string;
}

export interface PropagationStep {
  step: number;
  entity_type: string;
  org_name?: string;
  label: string;
  date: string;
}

export interface PropagationResponse {
  seed: { type: string; label: string };
  chain: PropagationStep[];
}

export interface GenealogyNode {
  id: string;
  label: string;
  date: string;
  children?: GenealogyNode[];
}

export interface GenealogyResponse {
  root: GenealogyNode;
}

export interface CrossPollinationStep {
  step: number;
  category: string;
  date: string;
  label?: string;
}

export interface CrossPollinationResponse {
  concept: string;
  chain: CrossPollinationStep[];
}

export interface DNAComponent {
  concept: string;
  weight: number;
  rationale: string;
}

export interface DNAResponse {
  paper_id: string;
  composition: DNAComponent[];
}

export interface DNASimilar {
  paper: { id: string; title: string; arxiv_id?: string };
  genetic_distance: number;
}

export interface DNASimilarResponse {
  paper_id: string;
  matches: DNASimilar[];
}

export interface EvolutionStage {
  stage: string;
  entity_type: string;
  entity_id: string;
  label: string;
  occurred_at: string;
}

export interface EvolutionResponse {
  concept: string;
  stages: EvolutionStage[];
}

export interface Collaboration {
  id: string;
  member_orgs: { id: string; name: string }[];
  cohesion_score: number;
  formed_around_concept: string;
}

export interface CollaborationsResponse {
  data: Collaboration[];
}

export interface InfluenceComponents {
  citation_velocity: number;
  implementation_count: number;
  hf_model_count: number;
  discussion: number;
  derivative_papers: number;
  cross_domain_spread: number;
}

export interface InfluenceResponse {
  paper_id: string;
  influence_score: number;
  components: InfluenceComponents;
}

export interface FrontierPrediction {
  category: CategoryRef;
  explosion_probability: number;
  horizon_weeks: number;
  top_contributing_signals: { signal: string; weight: number }[];
}

export interface FrontierResponse {
  data: FrontierPrediction[];
  model_version: string;
}

export interface Narrative {
  id: string;
  scope: string;
  scope_ref: string;
  period_start: string;
  period_end: string;
  narrative_text: string;
  referenced_entities: { type: string; id: string; title: string }[];
  generated_at: string;
}

export interface NarrativesResponse {
  data: Narrative[];
}

export interface TalentMove {
  author_id: string;
  author_name: string | null;
  from_org: { id: string; name: string } | null;
  to_org: { id: string; name: string } | null;
  moved_around: string | null;
  via_paper: { id: string; arxiv_id: string | null; title: string };
}

export interface TalentFlowResponse {
  data: TalentMove[];
  total_moves_found: number;
  generated_at: string;
}
