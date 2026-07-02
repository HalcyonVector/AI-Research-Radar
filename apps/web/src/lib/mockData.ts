/**
 * Realistic fallback / demo data. Used by the API proxy routes when the FastAPI
 * backend is unreachable, so every page renders meaningful content in preview.
 */

const CATS = {
  llms: { slug: "llms", name: "LLMs", color: "#6366f1" },
  reasoning: { slug: "reasoning-models", name: "Reasoning Models", color: "#10b981" },
  agents: { slug: "ai-agents", name: "AI Agents", color: "#f59e0b" },
  multiagent: { slug: "multi-agent-systems", name: "Multi-Agent Systems", color: "#eab308" },
  coding: { slug: "coding-agents", name: "Coding Agents", color: "#84cc16" },
  robotics: { slug: "robotics", name: "Robotics", color: "#ef4444" },
  vision: { slug: "computer-vision", name: "Computer Vision", color: "#3b82f6" },
  multimodal: { slug: "multimodal-ai", name: "Multimodal AI", color: "#8b5cf6" },
  speech: { slug: "speech-ai", name: "Speech AI", color: "#f97316" },
  rl: { slug: "reinforcement-learning", name: "Reinforcement Learning", color: "#ec4899" },
  infra: { slug: "ai-infrastructure", name: "AI Infrastructure", color: "#6b7280" },
  synth: { slug: "synthetic-data", name: "Synthetic Data", color: "#06b6d4" },
  rag: { slug: "rag-systems", name: "RAG Systems", color: "#14b8a6" },
  mcp: { slug: "mcp-ecosystem", name: "MCP Ecosystem", color: "#a78bfa" },
  evals: { slug: "evaluation-frameworks", name: "Evaluation Frameworks", color: "#fbbf24" },
};

export const MOCK_CATEGORIES = Object.values(CATS);

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function spark(seed: number, len = 12): number[] {
  const out: number[] = [];
  let v = 30 + (seed % 30);
  for (let i = 0; i < len; i++) {
    v += Math.sin(i + seed) * 6 + (i % 3) * 3 + (seed % 5);
    out.push(Math.max(4, Math.round(Math.abs(v) % 100)));
  }
  return out;
}

const AUTHORS = [
  { name: "Wei Chen", id: "a1" },
  { name: "Maria Rodriguez", id: "a2" },
  { name: "Yuki Tanaka", id: "a3" },
  { name: "Aditya Sharma", id: "a4" },
  { name: "Elena Volkov", id: "a5" },
  { name: "James O'Brien", id: "a6" },
  { name: "Fatima Al-Rashid", id: "a7" },
  { name: "Lucas Meyer", id: "a8" },
];

const PAPER_SEEDS = [
  { t: "Chain-of-Verification Reduces Hallucination in Large Language Models", c: CATS.reasoning, comp: 91, arx: "2410.01234" },
  { t: "Autonomous Multi-Agent Orchestration for Long-Horizon Software Tasks", c: CATS.agents, comp: 88, arx: "2410.02567" },
  { t: "Sparse Mixture-of-Experts Routing at Trillion-Parameter Scale", c: CATS.llms, comp: 86, arx: "2409.11890" },
  { t: "Vision-Language-Action Models for Generalist Robot Control", c: CATS.robotics, comp: 84, arx: "2409.09912" },
  { t: "Test-Time Compute Scaling Laws for Reasoning Models", c: CATS.reasoning, comp: 82, arx: "2410.03445" },
  { t: "Retrieval-Augmented Generation with Adaptive Chunk Graphs", c: CATS.rag, comp: 79, arx: "2408.07721" },
  { t: "Self-Play Fine-Tuning Converts Weak Language Models to Strong Ones", c: CATS.rl, comp: 77, arx: "2408.05001" },
  { t: "Unified Multimodal Tokenization for Any-to-Any Generation", c: CATS.multimodal, comp: 75, arx: "2409.14002" },
  { t: "Efficient Long-Context Attention via Hierarchical KV Compression", c: CATS.infra, comp: 73, arx: "2409.06678" },
  { t: "Synthetic Instruction Data Curation Beats Human Annotation", c: CATS.synth, comp: 71, arx: "2408.02110" },
  { t: "Real-Time Streaming Speech Recognition with Latent Diffusion", c: CATS.speech, comp: 68, arx: "2407.15530" },
  { t: "A Standard Protocol for Tool-Use Interoperability Across Agents", c: CATS.mcp, comp: 66, arx: "2410.04788" },
  { t: "Benchmarking Deception and Sandbagging in Frontier Models", c: CATS.evals, comp: 63, arx: "2409.19001" },
  { t: "Emergent Coordination in Populations of Reinforcement Learners", c: CATS.multiagent, comp: 58, arx: "2408.09934" },
  { t: "Repository-Level Code Synthesis with Retrieval and Execution Feedback", c: CATS.coding, comp: 55, arx: "2409.02245" },
  { t: "Open-Vocabulary 3D Scene Understanding from a Single Image", c: CATS.vision, comp: 52, arx: "2408.11876" },
];

function makePaper(i: number) {
  const s = PAPER_SEEDS[i % PAPER_SEEDS.length];
  const jitter = Math.floor(i / PAPER_SEEDS.length);
  const comp = Math.max(20, s.comp - jitter * 4);
  return {
    id: `paper-${i + 1}`,
    arxiv_id: s.arx,
    title: s.t,
    abstract_snippet:
      "We introduce a novel approach that substantially improves over prior state of the art on a broad suite of benchmarks. Our method combines a lightweight architectural change with a scalable training recipe, yielding consistent gains while remaining efficient at inference time.",
    published_at: daysAgo(i + 1),
    primary_category: s.c,
    authors: AUTHORS.slice(i % 4, (i % 4) + 3),
    scores: {
      composite: comp,
      impact: Math.max(15, comp - 6 + (i % 7)),
      momentum: Math.max(15, comp - 3 + (i % 5)),
      innovation: Math.max(15, comp - 10 + (i % 9)),
    },
    metrics: {
      citations: Math.round(comp * 3.2 + (i * 7) % 40),
      github_impls: Math.round(comp / 6 + (i % 5)),
      hf_models: Math.round(comp / 12 + (i % 3)),
      social_mentions: Math.round(comp * 5 + (i * 11) % 90),
    },
    has_ai_summary: i % 4 !== 3,
  };
}

export const MOCK_PAPERS = Array.from({ length: 30 }, (_, i) => makePaper(i));

export function mockPapersPage(cursor?: string, limit = 24) {
  const start = cursor ? parseInt(cursor, 10) || 0 : 0;
  const slice = MOCK_PAPERS.slice(start, start + limit);
  const nextStart = start + limit;
  const hasMore = nextStart < MOCK_PAPERS.length;
  return {
    data: slice,
    pagination: {
      cursor: hasMore ? String(nextStart) : null,
      has_more: hasMore,
      total_count: MOCK_PAPERS.length,
    },
  };
}

export function mockPaperDetail(id: string) {
  const base = MOCK_PAPERS.find((p) => p.id === id) ?? MOCK_PAPERS[0];
  return {
    ...base,
    id,
    org_name: "Frontier AI Lab",
    ai_summary: {
      core_contribution:
        "A self-verification loop that lets a model critique and revise its own drafts before producing a final answer, cutting factual errors without extra supervision.",
      key_innovation:
        "The verification prompts are drawn from the model's own uncertainty signals, so no external verifier or reward model is required.",
      problem_solved:
        "Large language models confidently produce plausible but incorrect statements. This work targets that hallucination failure mode directly.",
      practical_applications: [
        "Fact-sensitive assistants in medicine and law",
        "Automated literature review and citation checking",
        "High-stakes agentic workflows requiring reliable intermediate steps",
      ],
      limitations: [
        "Adds 1.6-2.3x inference latency from the verification pass",
        "Gains shrink on tasks with no verifiable ground truth",
        "Requires a capable base model to self-critique effectively",
      ],
      significance: "High",
      significance_rationale:
        "Addresses one of the most cited blockers to deploying LLMs in production, with a method that is model-agnostic and cheap to adopt.",
      related_concepts: [
        "self-consistency",
        "constitutional AI",
        "process reward models",
        "test-time compute",
      ],
    },
  };
}

export function mockRelatedPapers(id: string) {
  return MOCK_PAPERS.filter((p) => p.id !== id).slice(0, 5);
}

export function mockMetricsHistory(id: string) {
  return Array.from({ length: 12 }, (_, i) => ({
    recorded_at: daysAgo((11 - i) * 7),
    citation_count: 10 + i * i * 2,
    github_impl_count: 1 + Math.round(i * 1.3),
    hf_model_count: Math.round(i / 2),
    impact_score: 40 + i * 3.5,
    momentum_score: 30 + i * 4 + (i % 3) * 5,
  }));
}

export function mockTrends() {
  const data = MOCK_CATEGORIES.map((cat, i) => ({
    category: cat,
    scores: {
      growth: 40 + ((i * 7) % 55),
      momentum: 35 + ((i * 11) % 60),
      activity: 30 + ((i * 13) % 65),
      adoption: 25 + ((i * 17) % 70),
    },
    delta_7d: {
      growth: ((i * 5) % 40) - 15,
      momentum: ((i * 9) % 35) - 12,
    },
    papers_7d: 8 + ((i * 3) % 40),
    models_7d: 2 + ((i * 2) % 18),
    top_papers: MOCK_PAPERS.filter((p) => p.primary_category.slug === cat.slug).slice(0, 3),
    sparkline: spark(i + 1),
  }));
  return { data, generated_at: new Date().toISOString() };
}

export function mockTrend(slug: string) {
  const all = mockTrends().data;
  return all.find((t) => t.category.slug === slug) ?? all[0];
}

export function mockTrendHistory(slug: string) {
  return Array.from({ length: 13 }, (_, i) => ({
    recorded_at: daysAgo((12 - i) * 7),
    growth: 30 + i * 4 + (i % 3) * 4,
    momentum: 25 + i * 5,
    activity: 35 + i * 3,
    adoption: 20 + i * 4.5,
  }));
}

const MODEL_SEEDS = [
  { name: "Llama-4-Scout-17B", type: "text-generation", hf: "meta-llama/Llama-4-Scout-17B" },
  { name: "Qwen3-Coder-32B", type: "text-generation", hf: "Qwen/Qwen3-Coder-32B" },
  { name: "FLUX.1-krea-dev", type: "text-to-image", hf: "black-forest-labs/FLUX.1-krea-dev" },
  { name: "Whisper-Large-v4", type: "automatic-speech-recognition", hf: "openai/whisper-large-v4" },
  { name: "DeepSeek-R2-Distill", type: "text-generation", hf: "deepseek-ai/DeepSeek-R2-Distill" },
  { name: "SmolVLM2-2.2B", type: "image-text-to-text", hf: "HuggingFaceTB/SmolVLM2-2.2B" },
  { name: "Kokoro-TTS-82M", type: "text-to-speech", hf: "hexgrad/Kokoro-82M" },
  { name: "nomic-embed-text-v2", type: "feature-extraction", hf: "nomic-ai/nomic-embed-text-v2" },
  { name: "Gemma-3-27B-it", type: "text-generation", hf: "google/gemma-3-27b-it" },
  { name: "Stable-Video-XT", type: "text-to-video", hf: "stabilityai/stable-video-xt" },
];

function makeModel(i: number) {
  const s = MODEL_SEEDS[i % MODEL_SEEDS.length];
  const jitter = Math.floor(i / MODEL_SEEDS.length);
  return {
    id: `model-${i + 1}`,
    hf_model_id: s.hf,
    name: s.name,
    description:
      "A high-performance open-weights model with strong benchmark results, permissive licensing, and broad ecosystem support.",
    model_type: s.type,
    downloads_7d: Math.round(120000 / (i + 1) + 5000 - jitter * 800),
    downloads_30d: Math.round(480000 / (i + 1) + 20000),
    downloads_total: Math.round(3_200_000 / (i + 1) + 100000),
    likes: Math.round(2400 / (i + 1) + 50),
    growth_score: Math.max(20, 95 - i * 6 - jitter * 3),
    popularity_score: Math.max(20, 92 - i * 5),
    linked_paper_id: i % 2 === 0 ? `paper-${(i % MOCK_PAPERS.length) + 1}` : null,
  };
}

export const MOCK_MODELS = Array.from({ length: 20 }, (_, i) => makeModel(i));

export function mockModelsPage(cursor?: string, limit = 24) {
  const start = cursor ? parseInt(cursor, 10) || 0 : 0;
  const slice = MOCK_MODELS.slice(start, start + limit);
  const nextStart = start + limit;
  const hasMore = nextStart < MOCK_MODELS.length;
  return {
    data: slice,
    pagination: {
      cursor: hasMore ? String(nextStart) : null,
      has_more: hasMore,
      total_count: MOCK_MODELS.length,
    },
  };
}

export function mockModel(id: string) {
  return MOCK_MODELS.find((m) => m.id === id) ?? MOCK_MODELS[0];
}

export function mockModelHistory(id: string) {
  return Array.from({ length: 12 }, (_, i) => ({
    recorded_at: daysAgo((11 - i) * 7),
    downloads: 20000 + i * i * 1500,
    likes: 100 + i * 45,
    growth_score: 40 + i * 4,
    popularity_score: 35 + i * 4.5,
  }));
}

export function mockSearch(q: string) {
  const query = q || "reasoning";
  const papers = MOCK_PAPERS.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    highlight: p.abstract_snippet.slice(0, 120) + "…",
    score: p.scores.composite,
    type: "paper",
  }));
  const models = MOCK_MODELS.slice(0, 3).map((m) => ({
    id: m.id,
    title: m.name,
    highlight: m.description.slice(0, 100) + "…",
    score: m.growth_score,
    type: "model",
  }));
  const repos = [
    { id: "repo-1", title: "org/chain-of-verification", highlight: "Reference implementation", score: 88, type: "repo" },
    { id: "repo-2", title: "org/agent-orchestrator", highlight: "Long-horizon task runner", score: 81, type: "repo" },
  ];
  return { query, results: { papers, models, repos }, latency_ms: 42 };
}

export function mockDashboard() {
  const trends = mockTrends().data;
  const heatmap_data: { category_slug: string; date: string; count: number }[] = [];
  MOCK_CATEGORIES.slice(0, 10).forEach((cat, ci) => {
    for (let w = 0; w < 12; w++) {
      heatmap_data.push({
        category_slug: cat.slug,
        date: daysAgo((11 - w) * 7),
        count: Math.max(0, Math.round(Math.abs(Math.sin(ci + w) * 30 + (ci * 3) % 20))),
      });
    }
  });
  return {
    trending_papers: MOCK_PAPERS.slice(0, 6),
    emerging_categories: [...trends].sort((a, b) => b.delta_7d.growth - a.delta_7d.growth).slice(0, 5),
    breakout_models: MOCK_MODELS.slice(0, 5),
    sleeping_giants: mockSleepingGiants().data.slice(0, 3),
    latest_briefing_preview: {
      week_start: daysAgo(6),
      title: "Reasoning models eat the agent stack",
      excerpt:
        "This week the center of gravity shifted decisively toward test-time compute. Three of the top five papers extend reasoning through self-verification, and downstream agent frameworks are already adopting the pattern.",
    },
    heatmap_data,
    stats: { papers: 1284, models: 3921, repos: 872, breakthroughs: 14 },
  };
}

export function mockGraph(centerId: string) {
  const nodes = [
    { id: centerId, type: "paper", label: "Chain-of-Verification", score: 91, category: "reasoning-models" },
    { id: "p2", type: "paper", label: "Self-Consistency Decoding", score: 78, category: "reasoning-models" },
    { id: "p3", type: "paper", label: "Constitutional AI", score: 82, category: "llms" },
    { id: "p4", type: "paper", label: "Process Reward Models", score: 74, category: "reasoning-models" },
    { id: "a1", type: "author", label: "Wei Chen", score: 66 },
    { id: "a2", type: "author", label: "Maria Rodriguez", score: 60 },
    { id: "m1", type: "model", label: "DeepSeek-R2-Distill", score: 71 },
    { id: "r1", type: "repo", label: "org/chain-of-verification", score: 63 },
    { id: "c1", type: "concept", label: "test-time compute", score: 80 },
    { id: "c2", type: "concept", label: "self-critique", score: 58 },
  ];
  const edges = [
    { source: centerId, target: "p2", relation: "cites", weight: 0.8 },
    { source: centerId, target: "p3", relation: "cites", weight: 0.6 },
    { source: centerId, target: "p4", relation: "related", weight: 0.7 },
    { source: "a1", target: centerId, relation: "authored", weight: 1 },
    { source: "a2", target: centerId, relation: "authored", weight: 1 },
    { source: centerId, target: "m1", relation: "implemented_by", weight: 0.5 },
    { source: centerId, target: "r1", relation: "implemented_by", weight: 0.5 },
    { source: centerId, target: "c1", relation: "about", weight: 0.9 },
    { source: centerId, target: "c2", relation: "about", weight: 0.7 },
    { source: "p4", target: "c1", relation: "about", weight: 0.6 },
  ];
  return {
    nodes,
    edges,
    center_id: centerId,
    node_count: nodes.length,
    edge_count: edges.length,
  };
}

export function mockSleepingGiants() {
  const drivers = [
    ["Citation velocity", "Cited 4x faster than category median in the last 21 days"],
    ["Implementation surge", "6 new GitHub reimplementations appeared this week"],
    ["Cross-domain spread", "Now referenced by robotics and vision papers, not just its origin field"],
    ["Model adoption", "Two open-weights models shipped citing this as their core method"],
  ];
  return {
    data: MOCK_PAPERS.slice(4, 10).map((p, i) => ({
      paper: { id: p.id, arxiv_id: p.arxiv_id, title: p.title, citation_count: 6 + i * 3 },
      emerging_breakthrough_score: 88 - i * 5,
      breakthrough_driver: drivers[i % drivers.length][0],
      driver_detail: drivers[i % drivers.length][1],
      ai_rationale:
        "Despite a modest raw citation count, the acceleration and breadth of adoption strongly resemble papers that became foundational 6-9 months after publication. The method is simple to reproduce and composes cleanly with existing pipelines.",
      computed_at: daysAgo(1),
    })),
    generated_at: new Date().toISOString(),
  };
}

export function mockFrontier() {
  return {
    data: MOCK_CATEGORIES.slice(0, 8).map((cat, i) => ({
      category: cat,
      explosion_probability: Math.max(0.12, 0.82 - i * 0.09),
      horizon_weeks: 4 + (i % 3) * 2,
      top_contributing_signals: [
        { signal: "Publication acceleration", weight: 0.34 - i * 0.01 },
        { signal: "Author migration from adjacent fields", weight: 0.26 },
        { signal: "Model release cadence", weight: 0.22 },
        { signal: "GitHub star velocity", weight: 0.18 },
      ],
    })),
    model_version: "frontier-v0.4-demo",
  };
}

export function mockNarratives() {
  return {
    data: [
      {
        id: "narr-1",
        scope: "global",
        scope_ref: "week",
        period_start: daysAgo(7),
        period_end: daysAgo(0),
        narrative_text:
          "The dominant story this week is the collapse of the boundary between reasoning models and agent frameworks. Where reasoning was previously a property of a single model call, it is now being externalized into multi-step agent loops with self-verification at each step. Expect the next wave of benchmarks to measure reasoning-per-dollar rather than raw accuracy.",
        referenced_entities: [
          { type: "paper", id: "paper-1", title: "Chain-of-Verification Reduces Hallucination" },
          { type: "category", id: "reasoning-models", title: "Reasoning Models" },
          { type: "category", id: "ai-agents", title: "AI Agents" },
        ],
        generated_at: daysAgo(0),
      },
      {
        id: "narr-2",
        scope: "category",
        scope_ref: "robotics",
        period_start: daysAgo(14),
        period_end: daysAgo(0),
        narrative_text:
          "Robotics is quietly absorbing the vision-language-action paradigm. The field is consolidating around a small number of generalist control architectures, and the volume of teleoperation datasets is now the primary bottleneck rather than model capacity.",
        referenced_entities: [
          { type: "paper", id: "paper-4", title: "Vision-Language-Action Models for Generalist Robot Control" },
          { type: "category", id: "robotics", title: "Robotics" },
        ],
        generated_at: daysAgo(1),
      },
    ],
  };
}

export function mockPropagation(seedId: string) {
  return {
    seed: { type: "paper", label: "Chain-of-Verification Reduces Hallucination" },
    chain: [
      { step: 0, entity_type: "paper", org_name: "Frontier AI Lab", label: "Original paper published", date: daysAgo(120) },
      { step: 1, entity_type: "repo", org_name: "Community", label: "First open reimplementation", date: daysAgo(96) },
      { step: 2, entity_type: "model", org_name: "DeepSeek", label: "Adopted in DeepSeek-R2-Distill", date: daysAgo(63) },
      { step: 3, entity_type: "paper", org_name: "Academic Consortium", label: "Extended to multi-agent setting", date: daysAgo(38) },
      { step: 4, entity_type: "product", org_name: "Anthropic", label: "Referenced in production agent stack", date: daysAgo(12) },
    ],
  };
}

export function mockGenealogy(paperId: string) {
  return {
    root: {
      id: paperId,
      label: "Chain-of-Verification",
      date: daysAgo(120),
      children: [
        {
          id: "g1",
          label: "Self-Consistency Decoding",
          date: daysAgo(400),
          children: [
            { id: "g3", label: "Chain-of-Thought Prompting", date: daysAgo(720) },
          ],
        },
        {
          id: "g2",
          label: "Constitutional AI",
          date: daysAgo(500),
          children: [{ id: "g4", label: "RLHF", date: daysAgo(900) }],
        },
      ],
    },
  };
}

export function mockCrossPollination(concept: string) {
  return {
    concept: concept || "attention",
    chain: [
      { step: 0, category: "llms", date: daysAgo(300), label: "Originated in language modeling" },
      { step: 1, category: "computer-vision", date: daysAgo(200), label: "Adapted for vision transformers" },
      { step: 2, category: "robotics", date: daysAgo(120), label: "Applied to action prediction" },
      { step: 3, category: "speech-ai", date: daysAgo(60), label: "Used in streaming ASR" },
    ],
  };
}

export function mockDNA(paperId: string) {
  return {
    paper_id: paperId,
    composition: [
      { concept: "Self-verification", weight: 0.32, rationale: "Core mechanism the paper introduces" },
      { concept: "Test-time compute", weight: 0.24, rationale: "The paradigm the method operates within" },
      { concept: "Uncertainty estimation", weight: 0.18, rationale: "Signals used to trigger revision" },
      { concept: "Prompt engineering", weight: 0.14, rationale: "How verification steps are elicited" },
      { concept: "Factuality evaluation", weight: 0.12, rationale: "Primary benchmark family used" },
    ],
  };
}

export function mockDNASimilar(paperId: string) {
  return {
    data: MOCK_PAPERS.filter((p) => p.id !== paperId)
      .slice(0, 6)
      .map((p, i) => ({ paper: { id: p.id, title: p.title }, distance: 0.08 + i * 0.06 })),
  };
}

export function mockEvolution(concept: string) {
  return {
    concept: concept || "chain-of-thought",
    stages: [
      { stage: "Origin", entity_type: "paper", entity_id: "paper-9", label: "Introduced as a prompting trick", occurred_at: daysAgo(720) },
      { stage: "Formalization", entity_type: "paper", entity_id: "paper-5", label: "Characterized with scaling laws", occurred_at: daysAgo(300) },
      { stage: "Internalization", entity_type: "model", entity_id: "model-5", label: "Baked into model training", occurred_at: daysAgo(120) },
      { stage: "Productization", entity_type: "product", entity_id: "prod-1", label: "Default in commercial assistants", occurred_at: daysAgo(30) },
    ],
  };
}

export function mockCollaborations() {
  return {
    data: [
      {
        id: "cluster-1",
        member_orgs: [
          { id: "o1", name: "Frontier AI Lab" },
          { id: "o2", name: "Academic Consortium" },
          { id: "o3", name: "DeepSeek" },
        ],
        cohesion_score: 0.84,
        formed_around_concept: "reasoning models",
      },
      {
        id: "cluster-2",
        member_orgs: [
          { id: "o4", name: "Robotics Institute" },
          { id: "o5", name: "Vision Group" },
        ],
        cohesion_score: 0.71,
        formed_around_concept: "vision-language-action",
      },
      {
        id: "cluster-3",
        member_orgs: [
          { id: "o6", name: "Open Model Alliance" },
          { id: "o7", name: "Infra Collective" },
          { id: "o8", name: "Eval Working Group" },
        ],
        cohesion_score: 0.63,
        formed_around_concept: "open evaluation",
      },
    ],
  };
}

export function mockInfluence(paperId: string) {
  return {
    paper_id: paperId,
    influence_score: 87,
    components: {
      citation_velocity: 82,
      implementation_count: 74,
      hf_model_count: 61,
      discussion: 90,
      derivative_papers: 68,
      cross_domain_spread: 79,
    },
  };
}

export function mockBriefing(week?: string) {
  return {
    id: "briefing-1",
    week_start: week || daysAgo(6),
    week_end: daysAgo(0),
    title: "Reasoning models eat the agent stack",
    total_papers: 187,
    total_models: 42,
    total_repos: 96,
    briefing_json: {},
    briefing_md: `# Weekly Research Briefing

## The big picture
This week the center of gravity shifted decisively toward **test-time compute**. Reasoning models are no longer a niche — they are becoming the default substrate for agent frameworks.

## Top papers
1. **Chain-of-Verification Reduces Hallucination** — self-critique without a reward model.
2. **Autonomous Multi-Agent Orchestration** — long-horizon software tasks, solved end to end.
3. **Sparse MoE at Trillion Scale** — routing that finally pays for itself.

## Models to watch
- DeepSeek-R2-Distill adoption is accelerating.
- FLUX.1-krea-dev is quietly dominating text-to-image downloads.

## What it means
Expect benchmarks to start measuring reasoning-per-dollar. The teams that win will be those who make verification cheap.`,
  };
}

export function mockBriefings() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `briefing-${i + 1}`,
    week_start: daysAgo((i + 1) * 7),
    week_end: daysAgo(i * 7),
    title: [
      "Reasoning models eat the agent stack",
      "The great open-weights consolidation",
      "Multimodal goes any-to-any",
      "Robotics finds its transformer moment",
      "RAG grows up: graphs over chunks",
      "Speech gets real-time and tiny",
      "Evaluation becomes adversarial",
      "The MCP tool-use standard emerges",
    ][i],
    total_papers: 210 - i * 8,
    total_models: 48 - i,
    total_repos: 102 - i * 3,
    briefing_json: {},
    briefing_md: "Weekly briefing summary.",
  }));
}
