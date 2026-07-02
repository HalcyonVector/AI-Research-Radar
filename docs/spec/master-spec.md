# AI Research Radar — Master Specification
**Version:** 1.1 | **Date:** July 2026 | **Status:** Production Blueprint

**What's new in v1.1:** Added the Research Intelligence Engine (1.4.8) — a new Layer 3 reasoning pillar over the existing knowledge graph, now the platform's flagship, differentiating capability. See 1.3.1 for how it fits alongside the pre-existing ingestion (Layer 1) and intelligence (Layer 2) layers. Nothing from v1.0 was removed; this release only adds.

---

# PART 1 — PRODUCT REQUIREMENTS DOCUMENT

## 1.1 Problem Statement

The global AI research ecosystem produces 500–1,000 new arXiv papers per day. Hugging Face hosts 800,000+ models. GitHub has tens of thousands of AI-related repositories. No single engineer, researcher, or founder can process this volume manually.

Existing tools fail in specific ways:

| Tool | Failure Mode |
|---|---|
| arXiv.org | No trend intelligence, raw PDF interface |
| Google Scholar | Citation-backward, not forward-looking |
| Hugging Face | Model-centric, no cross-source signal |
| Twitter/X | High noise, ephemeral, no structure |
| Research newsletters | Weekly cadence, human-bottlenecked, shallow |
| Semantic Scholar | Academic, no velocity or momentum signals |

**AI Research Radar** fills the gap: a continuously updated, AI-assisted intelligence layer over the global research ecosystem.

Most of the tools above — and most of this product's own 1.4.1–1.4.7 feature set — answer *what's happening*. The platform's defining capability, the Research Intelligence Engine (1.4.8), goes further: it reasons over the same data to answer *why it's happening, where it's going, and what it means*. See 1.3.1.

---

## 1.2 Core Jobs To Be Done

| User Type | Job To Be Done |
|---|---|
| AI Engineer | "Identify which new architectures I should prototype next quarter" |
| ML Researcher | "Find papers that challenge my current approach" |
| Technical Founder | "Know which AI capabilities are production-ready vs. still research" |
| VC Analyst | "Detect which research areas are about to generate startups" |
| PhD Student | "Map the literature around my thesis topic" |
| CS Student | "Learn what's actually happening at the frontier" |

---

## 1.3 Product Pillars

**1. Signal Density** — Every pixel earns its place. No raw PDFs, no pagination through 800 results.

**2. Velocity Awareness** — Absolute counts matter less than growth rate. A paper with 40 citations in 2 weeks beats one with 200 over 2 years.

**3. Cross-Source Fusion** — A breakthrough registers as: paper on arXiv + implementations on GitHub + models on Hugging Face + discussion on Reddit. Fusion across these signals creates insight none alone can.

**4. AI-Augmented Comprehension** — LLMs summarize, classify, compare, and explain. Humans navigate and decide.

**5. Temporal Awareness** — Research has momentum. The platform must show direction, not just position.

**6. Reasoning Over the Graph** — Storing relationships between papers, authors, organizations, and models is not the same as explaining them. The platform reasons over its own knowledge graph to surface propagation paths, lineage, cross-domain leakage, and forward-looking signal — the layer that separates an intelligence platform from an aggregator with a nice UI.

---

### 1.3.1 Platform Layers

AI Research Radar is built as three layers on top of the same underlying data. Layers 1 and 2 are the foundation described throughout this document; Layer 3 is the product's defining capability and flagship pillar (full spec: 1.4.8).

```
Layer 1 — Data Ingestion
  arXiv · GitHub · Hugging Face · Semantic Scholar citations · Reddit/HN
  Raw entities: papers, authors, organizations, models, repositories

Layer 2 — Intelligence
  Embeddings · Impact/Momentum/Innovation scoring · Knowledge graph edges
  Structured facts about individual entities and pairwise relationships

Layer 3 — Research Intelligence Engine   ◄── THE DIFFERENTIATOR (see 1.4.8)
  Reasoning over the Layer 2 graph to answer:
  "Why is this happening, where is it going, and what does it mean?"
  Idea propagation · Research genealogy · Sleeping giants · Cross-pollination
  Research DNA · Evolution timelines · Hidden collaborations · Influence
  ranking · Frontier prediction · AI-generated research narratives
```

Layer 3 does not require new data sources or a new architecture. Every capability in 1.4.8 is computed from data Layers 1–2 already collect (Part 3, Part 5) — it extracts materially more value from the existing pipeline rather than replacing any of it. Nothing described elsewhere in this specification is removed or downgraded by Layer 3's addition.

---

## 1.4 Feature Specifications

### 1.4.1 Research Dashboard (Homepage)

**Purpose:** Daily landing page. Answers "What happened in AI today/this week?"

**Panels:**

| Panel | Data | Update Cadence |
|---|---|---|
| Trending Now | Top 10 papers by citation velocity + social signal | Hourly |
| Emerging Areas | Research categories with highest week-over-week growth | Daily |
| Breakout Models | HF models with fastest download acceleration | Daily |
| Weekly Briefing | AI-generated digest of the week's key developments | Weekly (Monday 6am UTC) |
| Activity Heatmap | Calendar heatmap of paper publication volume by category | Daily |
| Benchmark Watch | Newly published benchmarks + leaderboard movements | Daily |

**Layout:** Bento grid. No traditional table/list interfaces. Cards with sparklines.

---

### 1.4.2 Paper Intelligence Page

Each paper gets a dedicated page generated on first fetch, cached thereafter.

**Sections:**

```
┌─────────────────────────────────────────────────────┐
│  METADATA BAR                                       │
│  Title · Authors · Institution · Date · Category   │
├─────────────────────────────────────────────────────┤
│  AI SUMMARY (Claude-generated)                      │
│  Core Contribution · Key Innovation · Problem Solved│
│  Practical Applications · Limitations               │
├──────────────────────┬──────────────────────────────┤
│  METRICS             │  VISUALIZATIONS              │
│  Citations           │  Citation velocity chart     │
│  GitHub impls        │  Related paper graph         │
│  HN/Reddit mentions  │  Topic co-occurrence         │
│  HF model count      │                              │
├──────────────────────┴──────────────────────────────┤
│  RELATED PAPERS (vector similarity + citation graph)│
└─────────────────────────────────────────────────────┘
```

**AI Summary Prompt Contract:**
- Max 300 words
- Must answer: What? Why novel? Who benefits? What are the limits?
- Must cite specific claims to paper sections
- Must not hallucinate metrics

---

### 1.4.3 Research Trend Radar

Tracks 15 primary research categories. Each category has a dedicated page and feeds into the main radar visualization.

**Categories and Subcategories:**

| Category | Key Subcategories |
|---|---|
| LLMs | Pre-training, Fine-tuning, Alignment, Compression |
| Reasoning Models | Chain-of-thought, Tree-of-thought, Formal Verification |
| AI Agents | Tool use, Planning, Memory, Multi-step reasoning |
| Multi-Agent Systems | Coordination, Debate, Role specialization |
| Coding Agents | Code generation, Debugging, Repo-level understanding |
| Robotics | Manipulation, Locomotion, World models |
| Computer Vision | Detection, Segmentation, Generation, 3D |
| Multimodal AI | Vision-Language, Audio-Language, Video understanding |
| Speech AI | ASR, TTS, Voice cloning, Real-time |
| Reinforcement Learning | RLHF, GRPO, Offline RL, World models |
| AI Infrastructure | Inference optimization, Quantization, Serving |
| Synthetic Data | Data generation, Augmentation, Curation |
| RAG Systems | Retrieval, Indexing, Hybrid search, Agentic RAG |
| MCP Ecosystem | Protocol design, Tool integration, Agent memory |
| Evaluation Frameworks | Benchmarks, Safety evals, Capability evals |

**Radar Scores (per category, weekly):**

```
Growth Score      = log(papers_this_week / papers_last_week) × 100
Momentum Score    = ewma(growth_scores, span=4weeks)
Activity Score    = normalize(citations + github_stars + hf_downloads)
Adoption Score    = normalize(github_repos_with_prod_code + hf_models_in_prod)
```

---

### 1.4.4 Model Intelligence

**Data sources:** Hugging Face API (models endpoint), GitHub (linked repos)

**Tracked signals per model:**

| Signal | Source | Update Cadence |
|---|---|---|
| Downloads (7d, 30d) | HF API | Daily |
| Download delta | Computed | Daily |
| Likes | HF API | Daily |
| Linked papers | HF model card parsing | On ingest |
| GitHub stars (impl repos) | GitHub API | Daily |
| Benchmark scores | Papers With Code (future) | Weekly |

**Model cards parsed for:** architecture, training data, intended use, limitations.

---

### 1.4.5 Weekly AI Briefing

Auto-generated every Monday at 06:00 UTC.

**Structure:**
1. **This Week in Numbers** — papers published, models released, benchmarks dropped
2. **The Big Stories** — top 3 developments with AI-written paragraphs
3. **Emerging Signals** — categories that moved significantly this week
4. **Papers Worth Your Time** — top 5 by combined impact + novelty score
5. **Model Releases** — notable new models with one-line summaries
6. **What to Watch** — forward-looking signals (topics accelerating)

**Generation:** Structured prompt to Claude with top-N papers, model releases, and category deltas as context. Output validated against a schema before storage.

---

### 1.4.6 Research Explorer

**Filtering dimensions:**

| Dimension | Type | Values |
|---|---|---|
| Category | Multi-select | 15 primary categories |
| Date range | Date picker | Last 7d / 30d / 90d / custom |
| Organization | Typeahead | University, Lab, Company |
| Impact tier | Slider | Score 0–100 |
| Source | Toggle | arXiv, HF, GitHub |
| Has implementations | Boolean | Yes / No |
| Has AI summary | Boolean | Yes / No |

**Search:** Semantic (vector) + keyword (full-text) hybrid. Sub-500ms target via pgvector + PostgreSQL GIN index.

---

### 1.4.7 Knowledge Graph (Visualization Layer)

**Note:** This section is the *storage and rendering* layer for entity relationships. As of 1.4.8, it is one visualization surface among several driven by the Research Intelligence Engine — the graph shows nodes and edges; the engine reasons over them to produce propagation chains, genealogies, and predictions. Read 1.4.7 and 1.4.8 together.

Entities: Papers, Authors, Organizations, Research Areas, Models, Repositories.

Edge types:
- `CITES` (Paper → Paper)
- `AUTHORED_BY` (Paper → Author)
- `AFFILIATED_WITH` (Author → Organization)
- `IMPLEMENTS` (Repository → Paper)
- `BASED_ON` (Model → Paper)
- `RELATED_TO` (Paper ↔ Paper, via vector similarity)
- `BELONGS_TO` (Paper → ResearchArea)
- `DERIVED_FROM` (Paper → Paper, concept-shift genealogy edge — 1.4.8.2)
- `PROPAGATES_TO` (Organization → Organization, idea propagation step — 1.4.8.1)
- `CROSS_POLLINATES` (ResearchArea → ResearchArea, shared carrier concept — 1.4.8.4)

Visualization: D3.js force-directed graph, filterable by entity type and edge type, zoom + pan, click-to-expand neighbors. The three new edge types above render as a distinct visual style (dashed, directional, colored by relation) so a user can toggle "show reasoning edges" on top of the raw citation/authorship graph.

---

### 1.4.8 Research Intelligence Engine — Flagship Pillar

**Position in the product:** Sections 1.4.1–1.4.7 answer *what happened*. The Research Intelligence Engine answers *why it happened, where it's going, and what it means*. It is a reasoning layer over the knowledge graph (1.4.7), not a new data source — see 1.3.1 for how it fits into the platform's three layers.

**Why it's the differentiator:** Every capability below is computed from data the platform already ingests (Part 5) and structures (Part 3, 1.4.7). This is what turns the product from "a research tracker" into an AI-powered Bloomberg Terminal for AI research — a far more distinctive story than another aggregator, and the headline feature for a portfolio or interview.

**Sub-capabilities:**

| # | Capability | Question it answers |
|---|---|---|
| 1 | Idea Propagation (1.4.8.1) | How did this idea move through labs, geographies, and open source? |
| 2 | Research Genealogy (1.4.8.2) | What papers gave birth to this field? |
| 3 | Sleeping Giants (1.4.8.3) | Which unfamous papers are about to matter? |
| 4 | Cross-Pollination (1.4.8.4) | Where are ideas leaking across research areas? |
| 5 | Research DNA (1.4.8.5) | What is this paper actually made of, conceptually? |
| 6 | Evolution Timeline (1.4.8.6) | How did an idea get simplified, open-sourced, and adopted? |
| 7 | Hidden Collaborations (1.4.8.7) | Which institutions are working together in practice? |
| 8 | Research Influence Score (1.4.8.8) | What is this paper's true footprint, beyond citations? |
| 9 | Frontier Predictor (1.4.8.9) | Which research area is about to explode? |
| 10 | Research Storytelling (1.4.8.10) | What's the narrative arc of the last N months? |

---

#### 1.4.8.1 Idea Propagation

**Purpose:** Trace how a concept spreads across organizations and into production, instead of only showing citation edges.

**Example output:**
```
Mixture of Experts
  ↓
Google (Shazeer et al., 2017)
  ↓
DeepMind (GShard, 2020)
  ↓
Alibaba (Qwen-MoE)
  ↓
Open-source implementations (Mixtral fine-tunes, 40+ repos)
  ↓
Commercial adoption (production inference APIs)
```

**Data inputs:** `knowledge_graph_edges` (CITES, AUTHORED_BY, AFFILIATED_WITH, IMPLEMENTS, BASED_ON), paper `published_at`, first-author organization per paper, repo/model creation dates.

**Mechanism:**
1. Anchor on a seed concept (a paper, or a Research DNA concept label — 1.4.8.5).
2. Walk the citation graph forward in time, grouping citing papers by organization.
3. Collapse consecutive papers from the same organization into one node; a new node appears only when the *organization* changes or the artifact type changes (paper → repo → model → "commercial adoption," the last triggered once a derivative model/repo is owned by a for-profit org).
4. Order nodes chronologically into a propagation chain.

**Output:** Directed path (chain, not a general graph), stored as an ordered `{entity_type, entity_id, org_name, date}` list, cached per seed concept, materialized as `PROPAGATES_TO` edges (1.4.7).

---

#### 1.4.8.2 Research Genealogy

**Purpose:** Show the ancestry of a field or paper as a family tree, not a flat citation list.

**Example output:**
```
Transformer (2017)
  ↓
BERT (2018)
  ↓
GPT (2018–2020)
  ↓
InstructGPT (2022)
  ↓
RLHF
  ↓
Reasoning Models (2024–2025)
  ↓
Agentic AI (2025–2026)
```

**Data inputs:** `citations`, `paper_concept_composition` (Research DNA, 1.4.8.5), `paper_categories` over time.

**Mechanism:** Genealogy is a *pruned* citation tree — most cited-by edges are incremental follow-on work, not lineage. A paper is kept as a genealogy node only if it is a **concept-shift node**: its dominant Research DNA concept differs from the majority of the papers it cites, signaling it originated something rather than extended it. Concept-shift nodes are chained by citation path into a tree, stored as `DERIVED_FROM` edges (1.4.7).

**Output:** Tree structure (any node re-rootable), rendered as an expandable vertical genealogy view.

---

#### 1.4.8.3 Sleeping Giants (Emerging Breakthrough Detection)

**Purpose:** Surface papers that are *not yet famous* by citation count but show every other early signal of eventual importance — the inverse of a leaderboard.

**Emerging Breakthrough Score (0–100):**

```python
def emerging_breakthrough_score(paper, history: List[DailyMetrics]) -> float:
    # Deliberately excludes raw citation count — "not famous yet" is the point
    if paper.citation_count > 150:
        return 0.0  # already famous; graduates to normal Impact Score (3.3)

    impl_growth        = velocity(history, "github_impl_count", days=30)
    discussion_growth  = velocity(history, "social_mentions", days=30)
    related_work_growth = velocity(history, "citation_count", days=30)
    hf_growth          = velocity(history, "hf_model_count", days=30)
    low_citation_bonus = 1.0 - min(paper.citation_count / 150, 1.0)

    raw = (
        normalize(impl_growth)        * 30 +
        normalize(discussion_growth)  * 25 +
        normalize(related_work_growth) * 25 +
        normalize(hf_growth)          * 20
    ) * (0.5 + 0.5 * low_citation_bonus)

    return min(raw, 100)
```

**Rationale:** Every component is a *growth rate*, not an absolute count — a paper with 8 citations growing 3x/month outranks a flat paper with the same 8 citations. The 150-citation cutoff hardcodes "not famous yet."

**Surfacing:** New dashboard panel "Sleeping Giants" (extends 1.4.1's bento grid) — top 10 by score, refreshed daily, each card showing the score, the dominant growth driver ("GitHub implementations +340% this month"), and a one-line AI rationale.

---

#### 1.4.8.4 Cross-Pollination

**Purpose:** Detect ideas leaking across research areas — a technique's migration path through categories, not just which category a paper sits in.

**Example output:**
```
Diffusion
  ↓
Medical Imaging   (2022)
  ↓
Protein Folding   (2023)
  ↓
Audio Generation  (2023)
  ↓
Robotics          (2024–2025)
```

**Data inputs:** Research DNA concept vectors (1.4.8.5), `paper_categories`, `published_at`.

**Mechanism:**
1. Identify a "carrier concept" — a Research DNA component appearing with material weight (>15%) across ≥3 distinct primary categories.
2. For each category the concept touches, find the earliest paper where that concept crosses the 15% threshold — its "arrival date" in that category.
3. Order categories by arrival date into a cross-pollination chain, stored as `CROSS_POLLINATES` edges (1.4.7).

**Output:** Same chain structure as Idea Propagation (1.4.8.1), nodes are categories instead of organizations. Rendered as a horizontal category-hopping timeline.

---

#### 1.4.8.5 Research DNA

**Purpose:** Replace a single category label with a weighted concept fingerprint so papers can be compared by composition, not by tag.

**Example:**
```
Paper: "Agentic RAG with Verified Tool Calls"
Category label (old):    "LLMs"
Research DNA (new):      65% Retrieval · 20% Multi-agent · 10% RL · 5% Formal verification
```

**Mechanism:**
1. Maintain a controlled vocabulary of ~60–100 concept tags, seeded from the 15 categories' subcategories (1.4.3) plus terms mined from existing AI summaries (1.4.2).
2. On paper ingest, prompt the LLM (same structured-output pattern as 1.4.2) to decompose the abstract into a weighted distribution over the vocabulary, weights summing to 100.
3. Store as `paper_concept_composition(paper_id, concept, weight)`.

**AI Prompt Contract (Research DNA):**
- Weights sum to 100 (±1 floating-point tolerance)
- 2–6 concepts per paper (forces prioritization over diluted tag soup)
- Every concept must come from the controlled vocabulary — free text rejected by schema validation
- One rationale clause required per concept

**Output / comparison:** "Genetic distance" between two papers = cosine distance between their concept-weight vectors (zero-padded over the shared vocabulary). Powers a "Similar DNA" panel on the paper page (1.4.2), distinct from the existing embedding-based "Related Papers" — DNA similarity is compositional, embedding similarity is topical.

---

#### 1.4.8.6 Evolution Timeline

**Purpose:** Tell the adoption story of an idea, not just its citation graph.

```
Idea introduced   → first paper establishing the concept
  ↓
Improved          → papers with the concept as dominant DNA component + rising composite score
  ↓
Simplified        → AI summary's key_innovation field mentions simplification/efficiency (1.4.2)
  ↓
Open-sourced       → first linked repository (repositories.linked_paper_id)
  ↓
Benchmark leader    → first appearance atop a tracked leaderboard (1.4.1 Benchmark Watch)
  ↓
Industry adoption    → first HF model or repo owned by a for-profit org linked to the idea
```

**Mechanism:** Each stage is a timestamped event derived entirely from existing tables — a query/aggregation layer over Parts 3 and 5, not a new ingestion pipeline. Stored as `evolution_timeline_events(id, seed_concept, stage, entity_type, entity_id, occurred_at)`, recomputed weekly per tracked concept.

**Output:** Horizontal stage timeline, each stage clickable to its underlying paper/repo/model.

---

#### 1.4.8.7 Hidden Collaborations

**Purpose:** Surface institution-level collaboration clusters instead of author-pair lists.

**Example output:**
```
Stanford → OpenAI → Anthropic → DeepMind → NVIDIA → Berkeley
```
(A cluster of organizations whose researchers repeatedly co-author, cross-cite, or share model/repo lineage — even without one paper connecting all of them.)

**Mechanism:**
1. Build an organization-level graph: edge weight(Org A, Org B) = co-authored papers + weighted cross-citations + shared model/repo lineage.
2. Run community detection (Louvain or label propagation) to find clusters.
3. A cluster surfaces only once internal edge density crosses a threshold *and* has grown month-over-month — avoids flagging static, long-known partnerships as "new."

**Output:** `collaboration_clusters(id, member_org_ids, cohesion_score, formed_around_concept, first_detected_at, last_updated_at)`. Rendered as an org-to-org chain/cluster graph, filterable by concept.

---

#### 1.4.8.8 Research Influence Score

**Purpose:** Replace citation-only ranking with a richer influence measure, used specifically on Research Intelligence Engine surfaces.

```python
def influence_score(paper, history: List[DailyMetrics]) -> float:
    citation_velocity    = velocity(history, "citation_count", days=30)
    implementation_count = paper.github_impl_count
    hf_model_count       = paper.hf_model_count
    discussion            = paper.social_mentions
    derivative_papers     = count_concept_shift_children(paper)      # genealogy, 1.4.8.2
    cross_domain_spread   = count_distinct_categories_citing(paper)  # cross-pollination, 1.4.8.4

    return (
        normalize(citation_velocity)    * 25 +
        normalize(implementation_count) * 20 +
        normalize(hf_model_count)       * 15 +
        normalize(discussion)           * 15 +
        normalize(derivative_papers)    * 15 +
        normalize(cross_domain_spread)  * 10
    )
```

**Rationale:** This is deliberately kept separate from the existing Impact Score (3.3) rather than merged into it. Impact Score stays the fast, simple default sort used across 1.4.1–1.4.7; Influence Score is the deeper, cross-source metric used on Layer 3 surfaces (leaderboards, genealogy weighting, sleeping-giant tie-breaking).

**Output:** Stored per paper, recomputed nightly alongside Impact/Momentum/Innovation (3.3).

---

#### 1.4.8.9 Frontier Predictor

**Purpose:** Forecast which research category is most likely to accelerate significantly in the next 3–6 months.

**Signals per category (weekly):**

| Signal | Source |
|---|---|
| Submission velocity | `trend_snapshots.paper_count` slope |
| New-author rate | Share of `paper_authors` this period with no prior papers in category |
| GitHub growth | `repositories.stars_7d_delta` sum, category-linked repos |
| Benchmark activity | New benchmarks / leaderboard submissions (1.4.1) |
| Implementation growth | New repos linked to category papers, week-over-week |
| Funding/hiring signal *(Phase 2, out of MVP scope)* | External API (e.g. Crunchbase) or manual curation |

**Mechanism (MVP):** Gradient-boosted or logistic regression model (scikit-learn — no deep learning needed at this data volume), trained on historical `trend_snapshots` with label = "did this category's growth_score increase >50% within the following 12 weeks." Features are the signals above, lagged. Output is a probability per category, never a binary claim.

**Output:** `frontier_predictions(id, category_id, explosion_probability, horizon_weeks, top_contributing_signals JSONB, model_version, generated_at)`. Always displayed with "probabilistic estimate, not a guarantee" plus the top 3 contributing signals shown for transparency (see 13.3 Product Risks).

---

#### 1.4.8.10 Research Storytelling

**Purpose:** Generate narrative prose explaining a period's shift, instead of a flat list of papers.

> "The last six months have seen a shift from pure reasoning models toward agentic workflows. This began with DeepSeek-R1's release in January, accelerated after tool-use benchmarks showed agentic approaches outperforming chain-of-thought alone on real-world tasks, and today multi-step agent frameworks dominate new GitHub implementations in the category."

**Mechanism:** Structured prompt to Claude given: top concept-shift papers in the period (genealogy, 1.4.8.2), category growth deltas (1.4.3), evolution-timeline stage transitions in the window (1.4.8.6), and sleeping-giant-to-mainstream graduations (1.4.8.3). Reuses the Weekly Briefing's prompt-and-validate pattern (1.4.5, 5.5) as a new template, not a new pipeline.

**Prompt Contract:**
- Every named event/paper traceable to a specific entity ID, stored alongside the narrative for click-through
- No unattributed causal claims — every "accelerated after X" must reference a dated entity
- Max 400 words
- Every `[[paper:uuid]]` / `[[category:slug]]` reference must resolve to a real entity before storage; regenerate on failure (same retry pattern as 5.5)

**Output:** `research_narratives(id, scope, period_start, period_end, narrative_text, referenced_entities UUID[], generated_at, model_used)`. Rendered inline in the Weekly Briefing (1.4.5), on category pages (1.4.3), and in a dedicated "Research Storylines" feed.

---

**What Layer 3 deliberately does not do:** invent new data sources, replace the existing Impact/Momentum/Innovation scores (3.3), or remove the Knowledge Graph visualization (1.4.7). It computes richer signal from what Parts 3 and 5 already collect, and gives the graph a reason to exist beyond browsing.

---

## 1.5 Non-Functional Requirements

| Requirement | Target | Mechanism |
|---|---|---|
| Dashboard load | < 2s | SSR + Redis cache + CDN |
| Search latency | < 500ms | pgvector ANN + GIN index |
| Ingestion lag | < 4h from paper publish | Celery beat every 2h |
| AI summary generation | < 30s per paper | Async, queued, cached |
| Uptime | 99.5% | Railway health checks + auto-restart |
| API rate compliance | 100% | Token bucket per source |
| Accessibility | WCAG 2.1 AA | axe-core CI checks |

---

# PART 2 — TECHNICAL ARCHITECTURE

## 2.1 System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│   Browser (Next.js SSR)        Mobile (future PWA)              │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                              │
│   App Router · RSC · TanStack Query · shadcn/ui                 │
│   Deployed: Vercel Edge Network                                  │
└─────────────────────────┬────────────────────────────────────────┘
                          │ REST / JSON
┌─────────────────────────▼────────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│   /api/v1/* endpoints · Auth middleware · Rate limiting         │
│   Deployed: Railway (auto-scaling containers)                    │
├──────────────────┬──────────────────┬────────────────────────────┤
│   Paper Service  │  Trend Service   │  AI Insight Service        │
│   Model Service  │  Graph Service   │  Briefing Service          │
│   Search Service │  Score Service   │  Export Service            │
├──────────────────┴──────────────────┴────────────────────────────┤
│   Intelligence Engine Service  (Layer 3 — 1.4.8, flagship)       │
└──────┬───────────────────────────────────────────────┬───────────┘
       │                                          │
┌──────▼───────────┐              ┌───────────────▼─────────────────┐
│   POSTGRESQL     │              │   REDIS                         │
│   + pgvector     │              │   Cache · Queues · Rate limits  │
│   Supabase host  │              │   Railway host                  │
└──────────────────┘              └──────────────────────────────────┘
                                          │
┌─────────────────────────────────────────▼───────────────────────┐
│                    CELERY WORKERS                               │
│   Ingestion Workers · AI Summary Workers · Score Workers        │
│   Briefing Worker · Graph Builder Worker                        │
│   Intelligence Engine Workers (Layer 3 — see 5.8)                │
│   Deployed: Railway (separate worker containers)                │
├─────────────────┬───────────────────────────────────────────────┤
│   ARXIV FETCHER │  HF FETCHER  │  GITHUB FETCHER                │
│   (every 2h)    │  (every 6h)  │  (every 12h)                   │
└─────────────────┴───────────────────────────────────────────────┘
                          │
                    External APIs:
                    arXiv API · Hugging Face Hub · GitHub REST
                    Claude API (Anthropic) · OpenAI API (optional)
```

**Why this topology:**
- Next.js on Vercel gives edge-cached SSR with zero DevOps overhead
- FastAPI on Railway gives auto-scaling workers with straightforward deployment
- Supabase gives managed PostgreSQL + pgvector with built-in connection pooling (PgBouncer)
- Celery + Redis is battle-tested for background job orchestration; no overengineering with Kafka at MVP scale
- Separation of API and worker processes allows independent scaling

---

## 2.2 Service Responsibilities

### Paper Service
- CRUD for papers, authors, organizations
- Abstract storage and retrieval
- Embedding generation (on create/update)
- Deduplication (arXiv ID as canonical key)

### Trend Service
- Calculates category scores on schedule
- Stores TrendSnapshot records
- Serves trend timelines and radar data

### AI Insight Service
- Queues paper summarization jobs
- Calls Claude API with structured prompts
- Validates and stores generated summaries
- Handles retry with exponential backoff

### Search Service
- Hybrid search: pgvector ANN (semantic) + PostgreSQL FTS (keyword)
- Reranking: combine scores with RRF (Reciprocal Rank Fusion)
- Returns results with highlights and metadata

### Score Service
- Calculates Impact, Momentum, and Innovation scores
- Runs nightly batch scoring on all papers
- Maintains score history for trend lines

### Graph Service
- Maintains KnowledgeGraphEdge records
- Serves graph traversal queries (BFS up to depth 3)
- Computes graph metrics (centrality, clustering)

### Briefing Service
- Collects weekly top-N data across all services
- Generates briefing via Claude API
- Stores structured briefing JSON + markdown

### Intelligence Engine Service (Layer 3 — flagship, 1.4.8)
- Computes Research DNA concept decomposition per paper (1.4.8.5)
- Builds Idea Propagation and Cross-Pollination chains (1.4.8.1, 1.4.8.4)
- Prunes the citation graph into Research Genealogy trees (1.4.8.2)
- Computes Emerging Breakthrough Score for Sleeping Giants (1.4.8.3)
- Detects Hidden Collaboration clusters via community detection (1.4.8.7)
- Computes Research Influence Score, distinct from Impact Score (1.4.8.8)
- Trains and serves the Frontier Predictor model (1.4.8.9)
- Generates Research Storytelling narratives via Claude, with entity-reference validation (1.4.8.10)
- Owns all `DERIVED_FROM` / `PROPAGATES_TO` / `CROSS_POLLINATES` graph edges (1.4.7)
- Reads only from tables owned by other services — never ingests directly; this is a pure reasoning layer over Layer 1–2 data (see 1.3.1)

---

## 2.3 Caching Strategy

```
Layer 1: Vercel Edge Cache
  - Static assets, fonts, images
  - TTL: immutable

Layer 2: Next.js Full-Route Cache
  - SSR page HTML for public routes
  - TTL: 5 minutes (revalidate on demand)

Layer 3: TanStack Query (Client)
  - API responses cached in memory
  - staleTime: 2 minutes
  - gcTime: 10 minutes

Layer 4: Redis (Server)
  - Dashboard aggregates: TTL 1 hour
  - Search results: TTL 5 minutes
  - Paper pages: TTL 24 hours (invalidated on new citation)
  - Trend scores: TTL 1 hour
  - Intelligence Engine results (1.4.8): Sleeping Giants / Frontier Predictions TTL 24h;
    Propagation / Genealogy / Cross-Pollination chains TTL 7 days; Research Narratives
    are immutable once generated (new narrative = new row, never an overwrite)

Layer 5: PostgreSQL materialized views
  - top_papers_mv: refreshed hourly
  - category_stats_mv: refreshed hourly
  - author_stats_mv: refreshed daily
```

---

# PART 3 — DATABASE SCHEMA

## 3.1 Core Tables

```sql
-- ============================================================
-- PAPERS
-- ============================================================
CREATE TABLE papers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arxiv_id        VARCHAR(20) UNIQUE,          -- e.g. "2401.12345"
    title           TEXT NOT NULL,
    abstract        TEXT NOT NULL,
    abstract_embedding VECTOR(1536),             -- text-embedding-3-small
    published_at    TIMESTAMPTZ NOT NULL,
    updated_at_source TIMESTAMPTZ,
    source          VARCHAR(20) NOT NULL DEFAULT 'arxiv',
    pdf_url         TEXT,
    html_url        TEXT,
    comment         TEXT,                        -- arXiv comment field
    journal_ref     TEXT,
    doi             TEXT,
    license         VARCHAR(100),
    
    -- Computed / enriched
    primary_category_id UUID REFERENCES research_categories(id),
    impact_score    FLOAT DEFAULT 0,
    momentum_score  FLOAT DEFAULT 0,
    innovation_score FLOAT DEFAULT 0,
    composite_score FLOAT DEFAULT 0,
    
    -- AI generated
    ai_summary      JSONB,                       -- structured summary
    ai_summary_generated_at TIMESTAMPTZ,
    ai_summary_model VARCHAR(50),
    
    -- Ingestion tracking
    ingested_at     TIMESTAMPTZ DEFAULT NOW(),
    last_enriched_at TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_papers_arxiv_id         ON papers(arxiv_id);
CREATE INDEX idx_papers_published_at     ON papers(published_at DESC);
CREATE INDEX idx_papers_composite_score  ON papers(composite_score DESC);
CREATE INDEX idx_papers_primary_category ON papers(primary_category_id);
CREATE INDEX idx_papers_embedding        ON papers USING ivfflat (abstract_embedding vector_cosine_ops)
                                          WITH (lists = 100);
CREATE INDEX idx_papers_fts             ON papers USING gin(to_tsvector('english', title || ' ' || abstract));


-- ============================================================
-- AUTHORS
-- ============================================================
CREATE TABLE authors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    name_normalized TEXT NOT NULL,               -- lowercase, no punctuation
    email           TEXT,
    h_index         INTEGER,
    citation_count  INTEGER DEFAULT 0,
    paper_count     INTEGER DEFAULT 0,
    
    -- Affiliations (current primary)
    primary_org_id  UUID REFERENCES organizations(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name_normalized)
);

CREATE INDEX idx_authors_name_normalized ON authors(name_normalized);


-- ============================================================
-- PAPER_AUTHORS (junction, ordered)
-- ============================================================
CREATE TABLE paper_authors (
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    position        SMALLINT NOT NULL,           -- 1 = first author
    is_corresponding BOOLEAN DEFAULT false,
    PRIMARY KEY (paper_id, author_id)
);

CREATE INDEX idx_paper_authors_author ON paper_authors(author_id);


-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    name_normalized TEXT NOT NULL UNIQUE,
    org_type        VARCHAR(30),                 -- 'university','lab','company','foundation'
    country         VARCHAR(50),
    website         TEXT,
    logo_url        TEXT,
    paper_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- RESEARCH_CATEGORIES
-- ============================================================
CREATE TABLE research_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(50) UNIQUE NOT NULL, -- 'llms', 'ai-agents'
    name            TEXT NOT NULL,
    description     TEXT,
    parent_id       UUID REFERENCES research_categories(id),
    arxiv_categories TEXT[],                     -- ['cs.CL', 'cs.AI']
    color_hex       VARCHAR(7),                  -- UI theming
    icon_name       VARCHAR(50),
    display_order   SMALLINT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAPER_CATEGORIES (papers can span multiple categories)
-- ============================================================
CREATE TABLE paper_categories (
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES research_categories(id),
    is_primary      BOOLEAN DEFAULT false,
    confidence      FLOAT,                       -- 0-1, from classifier
    source          VARCHAR(20) DEFAULT 'arxiv', -- 'arxiv','classifier'
    PRIMARY KEY (paper_id, category_id)
);


-- ============================================================
-- MODELS (Hugging Face)
-- ============================================================
CREATE TABLE models (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hf_model_id           TEXT UNIQUE NOT NULL,  -- 'meta-llama/Llama-3-8B'
    name                  TEXT NOT NULL,
    description           TEXT,
    model_type            VARCHAR(50),           -- 'text-generation','image-classification'
    architecture          VARCHAR(100),          -- 'LlamaForCausalLM'
    
    -- Metrics (point-in-time, latest)
    downloads_total       BIGINT DEFAULT 0,
    downloads_7d          BIGINT DEFAULT 0,
    downloads_30d         BIGINT DEFAULT 0,
    likes                 INTEGER DEFAULT 0,
    
    -- Organization
    org_id               UUID REFERENCES organizations(id),
    hf_org_name          TEXT,
    
    -- Linkage
    linked_paper_id       UUID REFERENCES papers(id),
    github_repo_url       TEXT,
    
    -- Card parsing
    model_card_raw        TEXT,
    license               VARCHAR(100),
    languages             TEXT[],
    tags                  TEXT[],
    
    -- Scoring
    popularity_score      FLOAT DEFAULT 0,
    growth_score          FLOAT DEFAULT 0,
    
    hf_created_at         TIMESTAMPTZ,
    hf_last_modified      TIMESTAMPTZ,
    ingested_at           TIMESTAMPTZ DEFAULT NOW(),
    last_refreshed_at     TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_models_hf_id          ON models(hf_model_id);
CREATE INDEX idx_models_downloads_7d   ON models(downloads_7d DESC);
CREATE INDEX idx_models_popularity     ON models(popularity_score DESC);
CREATE INDEX idx_models_type           ON models(model_type);


-- ============================================================
-- MODEL_DOWNLOAD_HISTORY (time series)
-- ============================================================
CREATE TABLE model_download_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    recorded_at     DATE NOT NULL,
    downloads_total BIGINT,
    downloads_7d    BIGINT,
    downloads_30d   BIGINT,
    likes           INTEGER,
    UNIQUE(model_id, recorded_at)
);

CREATE INDEX idx_model_dl_history ON model_download_history(model_id, recorded_at DESC);


-- ============================================================
-- REPOSITORIES (GitHub)
-- ============================================================
CREATE TABLE repositories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_full_name TEXT UNIQUE NOT NULL,       -- 'huggingface/transformers'
    name            TEXT NOT NULL,
    description     TEXT,
    url             TEXT NOT NULL,
    homepage_url    TEXT,
    
    -- Metrics
    stars           INTEGER DEFAULT 0,
    forks           INTEGER DEFAULT 0,
    watchers        INTEGER DEFAULT 0,
    open_issues     INTEGER DEFAULT 0,
    stars_7d_delta  INTEGER DEFAULT 0,
    stars_30d_delta INTEGER DEFAULT 0,
    
    -- Classification
    primary_language VARCHAR(50),
    topics          TEXT[],
    is_research_impl BOOLEAN DEFAULT false,      -- implements a paper?
    
    -- Linkage
    linked_paper_id UUID REFERENCES papers(id),
    linked_model_id UUID REFERENCES models(id),
    
    github_created_at  TIMESTAMPTZ,
    github_pushed_at   TIMESTAMPTZ,
    ingested_at        TIMESTAMPTZ DEFAULT NOW(),
    last_refreshed_at  TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repos_stars      ON repositories(stars DESC);
CREATE INDEX idx_repos_stars_7d   ON repositories(stars_7d_delta DESC);
CREATE INDEX idx_repos_paper      ON repositories(linked_paper_id);


-- ============================================================
-- CITATIONS
-- ============================================================
CREATE TABLE citations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citing_paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    cited_paper_id  UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    source          VARCHAR(30) DEFAULT 'semantic_scholar',
    discovered_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(citing_paper_id, cited_paper_id)
);

CREATE INDEX idx_citations_cited   ON citations(cited_paper_id);
CREATE INDEX idx_citations_citing  ON citations(citing_paper_id);


-- ============================================================
-- TREND_SNAPSHOTS (time series for category metrics)
-- ============================================================
CREATE TABLE trend_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES research_categories(id),
    snapshot_date   DATE NOT NULL,
    period          VARCHAR(10) NOT NULL,        -- 'daily','weekly'
    
    -- Raw counts
    paper_count     INTEGER DEFAULT 0,
    model_count     INTEGER DEFAULT 0,
    repo_count      INTEGER DEFAULT 0,
    citation_count  INTEGER DEFAULT 0,
    
    -- Computed scores
    growth_score    FLOAT,
    momentum_score  FLOAT,
    activity_score  FLOAT,
    adoption_score  FLOAT,
    
    -- Top entities
    top_paper_ids   UUID[],
    top_model_ids   UUID[],
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, snapshot_date, period)
);

CREATE INDEX idx_trend_snapshots_category ON trend_snapshots(category_id, snapshot_date DESC);


-- ============================================================
-- WEEKLY_REPORTS
-- ============================================================
CREATE TABLE weekly_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start      DATE UNIQUE NOT NULL,        -- Monday
    week_end        DATE NOT NULL,
    
    -- Stats
    total_papers    INTEGER,
    total_models    INTEGER,
    total_repos     INTEGER,
    
    -- Generated content
    briefing_json   JSONB NOT NULL,              -- structured briefing
    briefing_md     TEXT NOT NULL,               -- markdown version
    
    -- Generation metadata
    generated_at    TIMESTAMPTZ,
    model_used      VARCHAR(50),
    prompt_version  VARCHAR(10),
    
    -- Publication
    published_at    TIMESTAMPTZ,
    is_published    BOOLEAN DEFAULT false,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- KNOWLEDGE_GRAPH_EDGES
-- ============================================================
CREATE TABLE knowledge_graph_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source entity
    source_type     VARCHAR(20) NOT NULL,        -- 'paper','author','org','model','repo','category'
    source_id       UUID NOT NULL,
    
    -- Target entity
    target_type     VARCHAR(20) NOT NULL,
    target_id       UUID NOT NULL,
    
    -- Edge
    relation        VARCHAR(30) NOT NULL,        -- 'cites','authored_by','implements','based_on',
                                                  -- 'derived_from','propagates_to','cross_pollinates' (1.4.8)
    weight          FLOAT DEFAULT 1.0,
    properties      JSONB,
    
    source          VARCHAR(30),                 -- where this edge was derived from
    discovered_at   TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_type, source_id, target_type, target_id, relation)
);

CREATE INDEX idx_kge_source ON knowledge_graph_edges(source_type, source_id);
CREATE INDEX idx_kge_target ON knowledge_graph_edges(target_type, target_id);
CREATE INDEX idx_kge_relation ON knowledge_graph_edges(relation);


-- ============================================================
-- PAPER_METRICS_HISTORY (daily snapshot for scoring trends)
-- ============================================================
CREATE TABLE paper_metrics_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    recorded_at     DATE NOT NULL,
    citation_count  INTEGER DEFAULT 0,
    github_impl_count INTEGER DEFAULT 0,
    hf_model_count  INTEGER DEFAULT 0,
    impact_score    FLOAT,
    momentum_score  FLOAT,
    UNIQUE(paper_id, recorded_at)
);

CREATE INDEX idx_pmh_paper ON paper_metrics_history(paper_id, recorded_at DESC);


-- ============================================================
-- SOCIAL_MENTIONS (Reddit, HN, future)
-- ============================================================
CREATE TABLE social_mentions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID REFERENCES papers(id),
    model_id        UUID REFERENCES models(id),
    platform        VARCHAR(20) NOT NULL,        -- 'reddit','hn','twitter'
    external_id     TEXT,
    url             TEXT,
    title           TEXT,
    score           INTEGER DEFAULT 0,           -- upvotes / points
    comment_count   INTEGER DEFAULT 0,
    mentioned_at    TIMESTAMPTZ,
    discovered_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_paper  ON social_mentions(paper_id);
CREATE INDEX idx_social_model  ON social_mentions(model_id);
CREATE INDEX idx_social_score  ON social_mentions(score DESC);


-- ============================================================
-- LAYER 3 — RESEARCH INTELLIGENCE ENGINE TABLES (see 1.4.8)
-- All tables below are computed/derived. Nothing here is an
-- ingestion target — every row is produced from the tables above.
-- ============================================================

-- ------------------------------------------------------------
-- PAPER_CONCEPT_COMPOSITION (Research DNA — 1.4.8.5)
-- ------------------------------------------------------------
CREATE TABLE paper_concept_composition (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    concept         VARCHAR(60) NOT NULL,        -- from controlled vocabulary
    weight          FLOAT NOT NULL,              -- 0-100, sums to ~100 per paper
    rationale       TEXT,                        -- one clause, from AI prompt contract
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    model_used      VARCHAR(50),
    UNIQUE(paper_id, concept)
);

CREATE INDEX idx_pcc_paper    ON paper_concept_composition(paper_id);
CREATE INDEX idx_pcc_concept  ON paper_concept_composition(concept, weight DESC);


-- ------------------------------------------------------------
-- PAPER_INTELLIGENCE_SCORES (Sleeping Giants + Influence — 1.4.8.3, 1.4.8.8)
-- ------------------------------------------------------------
CREATE TABLE paper_intelligence_scores (
    paper_id                   UUID PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
    emerging_breakthrough_score FLOAT DEFAULT 0,  -- 0 if citations > 150 (1.4.8.3)
    breakthrough_driver        VARCHAR(30),        -- 'implementations','discussion','citations','hf_models'
    influence_score            FLOAT DEFAULT 0,   -- 1.4.8.8, distinct from impact_score (3.3)
    influence_components       JSONB,              -- breakdown for UI transparency
    computed_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pis_breakthrough ON paper_intelligence_scores(emerging_breakthrough_score DESC);
CREATE INDEX idx_pis_influence    ON paper_intelligence_scores(influence_score DESC);


-- ------------------------------------------------------------
-- EVOLUTION_TIMELINE_EVENTS (1.4.8.6)
-- ------------------------------------------------------------
CREATE TABLE evolution_timeline_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seed_concept    VARCHAR(60) NOT NULL,
    stage           VARCHAR(30) NOT NULL,   -- 'introduced','improved','simplified','open_sourced',
                                             -- 'benchmark_leader','industry_adoption'
    entity_type     VARCHAR(20) NOT NULL,   -- 'paper','repository','model'
    entity_id       UUID NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL,
    discovered_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seed_concept, stage, entity_id)
);

CREATE INDEX idx_ete_concept ON evolution_timeline_events(seed_concept, occurred_at);


-- ------------------------------------------------------------
-- COLLABORATION_CLUSTERS (Hidden Collaborations — 1.4.8.7)
-- ------------------------------------------------------------
CREATE TABLE collaboration_clusters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_org_ids      UUID[] NOT NULL,
    cohesion_score      FLOAT NOT NULL,          -- community-detection internal density
    formed_around_concept VARCHAR(60),
    first_detected_at   TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at     TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT true     -- false once density drops below threshold
);

CREATE INDEX idx_cc_concept ON collaboration_clusters(formed_around_concept);
CREATE INDEX idx_cc_cohesion ON collaboration_clusters(cohesion_score DESC);


-- ------------------------------------------------------------
-- FRONTIER_PREDICTIONS (1.4.8.9)
-- ------------------------------------------------------------
CREATE TABLE frontier_predictions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id             UUID NOT NULL REFERENCES research_categories(id),
    explosion_probability   FLOAT NOT NULL,      -- 0-1
    horizon_weeks           SMALLINT NOT NULL DEFAULT 24,
    top_contributing_signals JSONB NOT NULL,      -- top 3 signals + weights, for UI transparency
    model_version           VARCHAR(20) NOT NULL,
    generated_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, generated_at)
);

CREATE INDEX idx_fp_category ON frontier_predictions(category_id, generated_at DESC);
CREATE INDEX idx_fp_probability ON frontier_predictions(explosion_probability DESC);


-- ------------------------------------------------------------
-- RESEARCH_NARRATIVES (Research Storytelling — 1.4.8.10)
-- ------------------------------------------------------------
CREATE TABLE research_narratives (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope               VARCHAR(20) NOT NULL,    -- 'global','category','concept'
    scope_ref           VARCHAR(60),             -- category slug or concept, if scoped
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    narrative_text      TEXT NOT NULL,
    referenced_entities UUID[] NOT NULL,         -- every [[type:id]] mention, validated pre-storage
    generated_at        TIMESTAMPTZ DEFAULT NOW(),
    model_used          VARCHAR(50)
);

CREATE INDEX idx_rn_scope ON research_narratives(scope, scope_ref, period_start DESC);


-- ============================================================
-- MATERIALIZED VIEWS
-- ============================================================

CREATE MATERIALIZED VIEW top_papers_mv AS
SELECT
    p.id, p.arxiv_id, p.title, p.published_at,
    p.composite_score, p.impact_score, p.momentum_score,
    p.ai_summary,
    rc.name AS primary_category,
    rc.slug AS category_slug,
    rc.color_hex,
    COUNT(DISTINCT pa.author_id) AS author_count,
    COUNT(DISTINCT c.citing_paper_id) AS citation_count,
    COUNT(DISTINCT r.id) AS impl_count
FROM papers p
LEFT JOIN research_categories rc ON rc.id = p.primary_category_id
LEFT JOIN paper_authors pa ON pa.paper_id = p.id
LEFT JOIN citations c ON c.cited_paper_id = p.id
LEFT JOIN repositories r ON r.linked_paper_id = p.id
WHERE p.published_at > NOW() - INTERVAL '90 days'
GROUP BY p.id, rc.name, rc.slug, rc.color_hex
ORDER BY p.composite_score DESC;

CREATE UNIQUE INDEX ON top_papers_mv(id);

-- Refresh hourly via Celery beat


CREATE MATERIALIZED VIEW category_stats_mv AS
SELECT
    rc.id, rc.slug, rc.name, rc.color_hex,
    COUNT(DISTINCT pc.paper_id) FILTER (WHERE p.published_at > NOW() - INTERVAL '7 days') AS papers_7d,
    COUNT(DISTINCT pc.paper_id) FILTER (WHERE p.published_at > NOW() - INTERVAL '30 days') AS papers_30d,
    COUNT(DISTINCT m.id) AS model_count,
    ts.growth_score,
    ts.momentum_score,
    ts.activity_score
FROM research_categories rc
LEFT JOIN paper_categories pc ON pc.category_id = rc.id
LEFT JOIN papers p ON p.id = pc.paper_id
LEFT JOIN models m ON m.id IN (
    SELECT id FROM models WHERE -- category linkage via tags/description
    EXISTS (SELECT 1 FROM paper_categories pc2 
            JOIN papers p2 ON p2.id = pc2.paper_id 
            WHERE pc2.category_id = rc.id 
            AND p2.id = models.linked_paper_id)
)
LEFT JOIN LATERAL (
    SELECT growth_score, momentum_score, activity_score
    FROM trend_snapshots ts2
    WHERE ts2.category_id = rc.id AND ts2.period = 'weekly'
    ORDER BY ts2.snapshot_date DESC
    LIMIT 1
) ts ON true
GROUP BY rc.id, rc.slug, rc.name, rc.color_hex, ts.growth_score, ts.momentum_score, ts.activity_score;

CREATE UNIQUE INDEX ON category_stats_mv(id);
```

---

## 3.2 Indexing Strategy Rationale

| Index | Why |
|---|---|
| `papers.abstract_embedding` (IVFFlat) | ANN search for semantic similarity. IVFFlat with lists=100 is appropriate for <5M vectors at MVP; migrate to HNSW at 10M+ |
| `papers.abstract + title` (GIN, tsvector) | Full-text keyword search. GIN is mandatory for multi-term FTS at speed |
| `papers.published_at DESC` | Most queries are time-bounded; BTree on timestamp is efficient for range scans |
| `papers.composite_score DESC` | Trending/top lists query by score descending; partial index possible for score > threshold |
| `citations.cited_paper_id` | Citation count queries are always "how many times was this paper cited" |
| `model_download_history (model_id, recorded_at DESC)` | Time series access pattern: latest N records per model |
| `knowledge_graph_edges (source_type, source_id)` | Graph traversal starts from a source node |

---

## 3.3 Scoring Formulas

### Impact Score (0–100)

```python
def impact_score(paper) -> float:
    # Log-normalize to handle power-law distributions
    citation_component = min(math.log1p(citations) / math.log1p(1000), 1.0) * 40
    impl_component     = min(math.log1p(github_impls) / math.log1p(50), 1.0) * 30
    discussion_component = min(math.log1p(social_mentions) / math.log1p(200), 1.0) * 20
    hf_component       = min(math.log1p(hf_model_count) / math.log1p(20), 1.0) * 10
    return citation_component + impl_component + discussion_component + hf_component
```

**Rationale:** Citations dominate (40pts) because they represent direct scholarly recognition. Implementations (30pts) signal practical adoption. Social discussion (20pts) captures community awareness. HF adoption (10pts) is a strong production signal but narrower.

### Momentum Score (0–100)

```python
def momentum_score(paper, history: List[DailyMetrics]) -> float:
    if len(history) < 7:
        return 0.0
    
    # Citation velocity: citations gained in last 7 days
    cit_velocity = history[-1].citation_count - history[-7].citation_count
    
    # Age-adjusted: newer papers get higher momentum for same velocity
    age_days = (date.today() - paper.published_at.date()).days
    age_penalty = 1.0 / math.log1p(max(age_days, 1))
    
    # EWMA of weekly velocities (span=4)
    velocities = [h.citation_count - history[max(i-7,0)].citation_count 
                  for i, h in enumerate(history)]
    ewma = pd.Series(velocities).ewm(span=4).mean().iloc[-1]
    
    raw = math.log1p(ewma) * age_penalty * 50
    return min(raw, 100)
```

**Rationale:** Momentum is about acceleration, not absolute position. Age penalty rewards recent papers that are gaining citations quickly. EWMA smooths noise.

### Innovation Score (0–100)

```python
def innovation_score(paper, category_papers: List[Paper]) -> float:
    # Semantic novelty: distance from centroid of existing papers in category
    centroid = np.mean([p.embedding for p in category_papers[-500:]], axis=0)
    novelty = cosine_distance(paper.embedding, centroid) * 40  # 0-40
    
    # Cross-category reach: how many other categories cite this paper
    cross_category_reach = len(set(
        pc.category_id 
        for c in paper.citations 
        for pc in c.citing_paper.categories
    ))
    cross_component = min(cross_category_reach / 5, 1.0) * 30  # 0-30
    
    # First-mover bonus: if paper introduces a term that becomes common
    # Approximated by: paper was in top-5% of category by date, 
    # and category grew significantly after
    first_mover = 30 if is_first_mover(paper) else 0
    
    return novelty + cross_component + first_mover
```

**Rationale:** Innovation is distinct from impact. A paper can be highly cited (impact) but incremental. Semantic distance from category centroid detects genuine departures. Cross-category citations indicate foundational contributions.

### Composite Score

```python
composite = (
    impact_score * 0.40 +
    momentum_score * 0.35 +
    innovation_score * 0.25
)
```

Impact weighted highest for default sort. Momentum weighted heavily to surface recent relevance. Innovation provides discovery signal.

### 3.3.1 Layer 3 Scores

Impact, Momentum, and Innovation above are the Layer 2 scores used as the default sort everywhere in 1.4.1–1.4.7. The Research Intelligence Engine (1.4.8) computes three additional scores that are intentionally *not* folded into the composite above, because they answer a different question ("is this about to matter" / "what's the true cross-source footprint" / "is this area about to accelerate") rather than "how good is this paper right now":

| Score | Defined in | Stored in |
|---|---|---|
| Emerging Breakthrough Score | 1.4.8.3 | `paper_intelligence_scores.emerging_breakthrough_score` |
| Research Influence Score | 1.4.8.8 | `paper_intelligence_scores.influence_score` |
| Frontier Explosion Probability | 1.4.8.9 | `frontier_predictions.explosion_probability` |

All three are recomputed on the same nightly batch-scoring cadence as Impact/Momentum/Innovation (see 5.8).

---

# PART 4 — API DESIGN

## 4.1 Design Principles

- REST over HTTP/1.1, JSON responses
- All list endpoints paginated with cursor (not offset — cursor is stable under concurrent writes)
- Versioned under `/api/v1/`
- All timestamps in ISO 8601 UTC
- Error responses follow RFC 9457 (Problem Details)
- Rate limiting: 100 req/min per API key, 20 req/min for AI-generation endpoints

## 4.2 Endpoint Inventory

### Papers

```
GET  /api/v1/papers
     ?q=<search_query>
     &category=<slug>
     &date_from=<ISO date>
     &date_to=<ISO date>
     &sort=composite_score|published_at|momentum_score
     &has_summary=true|false
     &cursor=<opaque>
     &limit=20 (max 100)

GET  /api/v1/papers/:id
GET  /api/v1/papers/:id/summary
GET  /api/v1/papers/:id/related
GET  /api/v1/papers/:id/graph
GET  /api/v1/papers/:id/metrics/history
POST /api/v1/papers/:id/summary/regenerate  # admin only
```

**GET /api/v1/papers response shape:**
```json
{
  "data": [
    {
      "id": "uuid",
      "arxiv_id": "2401.12345",
      "title": "...",
      "abstract_snippet": "...",
      "published_at": "2024-01-15T00:00:00Z",
      "primary_category": { "slug": "llms", "name": "LLMs", "color": "#6366f1" },
      "authors": [{ "name": "...", "id": "uuid" }],
      "scores": {
        "composite": 87.4,
        "impact": 72.1,
        "momentum": 91.0,
        "innovation": 68.3
      },
      "metrics": {
        "citations": 143,
        "github_impls": 12,
        "hf_models": 3,
        "social_mentions": 47
      },
      "has_ai_summary": true
    }
  ],
  "pagination": {
    "cursor": "eyJpZCI6Ii4uLiJ9",
    "has_more": true,
    "total_count": 4821
  }
}
```

### Trends

```
GET  /api/v1/trends
GET  /api/v1/trends/:category_slug
GET  /api/v1/trends/:category_slug/papers
GET  /api/v1/trends/:category_slug/models
GET  /api/v1/trends/:category_slug/history
     ?period=daily|weekly&from=<date>&to=<date>
```

**GET /api/v1/trends response:**
```json
{
  "data": [
    {
      "category": { "slug": "ai-agents", "name": "AI Agents", "color": "#f59e0b" },
      "scores": {
        "growth": 94.2,
        "momentum": 88.7,
        "activity": 76.3,
        "adoption": 61.0
      },
      "delta_7d": { "growth": +12.3, "momentum": +8.1 },
      "papers_7d": 234,
      "models_7d": 41,
      "top_papers": ["uuid1", "uuid2", "uuid3"],
      "sparkline": [72, 75, 79, 83, 88, 91, 94]
    }
  ],
  "generated_at": "2026-06-21T06:00:00Z"
}
```

### Models

```
GET  /api/v1/models
     ?sort=downloads_7d|growth_score|likes
     &model_type=text-generation|image-classification|...
     &category=<slug>
     &cursor=<opaque>&limit=20

GET  /api/v1/models/:id
GET  /api/v1/models/:id/history
GET  /api/v1/models/:id/related-papers
```

### Search

```
GET  /api/v1/search
     ?q=<query>
     &types=papers,models,repos
     &category=<slug>
     &limit=10
```

**Search response:**
```json
{
  "query": "mixture of experts scaling",
  "results": {
    "papers": [
      {
        "id": "uuid",
        "title": "...",
        "highlight": "...the <em>mixture of experts</em> approach scales...",
        "score": 0.94,
        "type": "paper"
      }
    ],
    "models": [],
    "repos": []
  },
  "latency_ms": 187
}
```

### Dashboard

```
GET  /api/v1/dashboard
     # Single composite endpoint, assembled server-side from Redis caches
     # Returns: trending_papers, emerging_categories, breakout_models,
     #          latest_briefing_preview, heatmap_data
     # TTL: 5 minutes
```

### Knowledge Graph

```
GET  /api/v1/graph/paper/:id?depth=2&edge_types=cites,authored_by,implements
GET  /api/v1/graph/author/:id?depth=2
GET  /api/v1/graph/category/:slug?depth=1
```

**Graph response:**
```json
{
  "nodes": [
    { "id": "uuid", "type": "paper", "label": "Attention Is All You Need", "score": 99.1 },
    { "id": "uuid", "type": "author", "label": "Vaswani et al.", "paper_count": 12 }
  ],
  "edges": [
    { "source": "uuid1", "target": "uuid2", "relation": "authored_by", "weight": 1.0 }
  ],
  "center_id": "uuid1",
  "node_count": 47,
  "edge_count": 83
}
```

### Briefings

```
GET  /api/v1/briefings?limit=10
GET  /api/v1/briefings/latest
GET  /api/v1/briefings/:week_start   # e.g. 2026-06-16
```

### Research Intelligence Engine (Layer 3 — flagship, see 1.4.8)

```
GET  /api/v1/intelligence/propagation/:seed_id      # 1.4.8.1 — chain by org
     ?seed_type=paper|concept

GET  /api/v1/intelligence/genealogy/:paper_id       # 1.4.8.2 — pruned lineage tree
     ?depth=5

GET  /api/v1/intelligence/sleeping-giants           # 1.4.8.3 — ranked list
     ?limit=10&category=<slug>

GET  /api/v1/intelligence/cross-pollination/:concept # 1.4.8.4 — chain by category

GET  /api/v1/intelligence/dna/:paper_id             # 1.4.8.5 — concept weights
GET  /api/v1/intelligence/dna/:paper_id/similar      # papers by genetic distance

GET  /api/v1/intelligence/evolution/:concept        # 1.4.8.6 — stage timeline

GET  /api/v1/intelligence/collaborations            # 1.4.8.7 — active clusters
     ?concept=<slug>

GET  /api/v1/intelligence/influence/:paper_id        # 1.4.8.8 — score + breakdown

GET  /api/v1/intelligence/frontier                  # 1.4.8.9 — ranked categories
     ?horizon_weeks=24

GET  /api/v1/intelligence/narratives                # 1.4.8.10 — storytelling feed
     ?scope=global|category|concept&scope_ref=<slug>&limit=10
```

**GET /api/v1/intelligence/sleeping-giants response shape:**
```json
{
  "data": [
    {
      "paper": { "id": "uuid", "arxiv_id": "2505.01234", "title": "...", "citation_count": 12 },
      "emerging_breakthrough_score": 88.4,
      "breakthrough_driver": "implementations",
      "driver_detail": "GitHub implementations +340% this month",
      "ai_rationale": "Citation count is low, but three independent labs have shipped inference-optimized forks in the last three weeks.",
      "computed_at": "2026-07-02T06:00:00Z"
    }
  ],
  "generated_at": "2026-07-03T06:00:00Z"
}
```

**GET /api/v1/intelligence/narratives response shape:**
```json
{
  "data": [
    {
      "id": "uuid",
      "scope": "category",
      "scope_ref": "ai-agents",
      "period_start": "2026-01-01",
      "period_end": "2026-06-30",
      "narrative_text": "The last six months have seen a shift from pure reasoning models toward agentic workflows...",
      "referenced_entities": [
        { "type": "paper", "id": "uuid", "title": "DeepSeek-R1" },
        { "type": "category", "id": "uuid", "slug": "ai-agents" }
      ],
      "generated_at": "2026-07-01T06:00:00Z"
    }
  ]
}
```

**GET /api/v1/intelligence/propagation/:seed_id response shape:**
```json
{
  "seed": { "type": "concept", "label": "Mixture of Experts" },
  "chain": [
    { "step": 1, "entity_type": "paper", "org_name": "Google", "label": "Shazeer et al., 2017", "date": "2017-01-23" },
    { "step": 2, "entity_type": "paper", "org_name": "DeepMind", "label": "GShard", "date": "2020-06-30" },
    { "step": 3, "entity_type": "paper", "org_name": "Alibaba", "label": "Qwen-MoE", "date": "2024-03-28" },
    { "step": 4, "entity_type": "repository", "org_name": "Open Source", "label": "Mixtral fine-tunes (40+ repos)", "date": "2024-01-08" },
    { "step": 5, "entity_type": "model", "org_name": "Commercial", "label": "Production inference APIs", "date": "2024-05-14" }
  ]
}
```

### Internal (admin)

```
POST /api/v1/internal/ingest/trigger
POST /api/v1/internal/scores/recompute
POST /api/v1/internal/briefing/generate
POST /api/v1/internal/intelligence/recompute     # triggers 5.8 pipeline on demand
GET  /api/v1/internal/jobs/status
```

## 4.3 Authentication

MVP: API key in `Authorization: Bearer <key>`. Keys stored as bcrypt hashes in PostgreSQL. Frontend Next.js API routes proxy to FastAPI — browser never holds the FastAPI key directly.

Rate limiting: Redis token bucket. Key: `api_rate:{key_hash}`. Resets every 60s.

## 4.4 Error Format (RFC 9457)

```json
{
  "type": "https://radar.ai/errors/not-found",
  "title": "Paper not found",
  "status": 404,
  "detail": "No paper with arxiv_id '9999.99999' exists",
  "instance": "/api/v1/papers/9999.99999"
}
```

---

# PART 5 — ETL PIPELINE DESIGN

## 5.1 Architecture Overview

```
CELERY BEAT (Scheduler)
  Every 2h  → arXiv fetch
  Every 6h  → HF models fetch
  Every 12h → GitHub repos refresh
  Every 1h  → Materialize views, score papers
  Mon 06:00 → Weekly briefing generation

         ↓ enqueue tasks

REDIS QUEUES
  ingestion.high    → arXiv new papers
  ingestion.normal  → HF + GitHub refreshes
  ai.summaries      → Claude API calls
  ai.embeddings     → Embedding generation
  scoring           → Score computation
  graph             → Graph edge creation

         ↓

  Ingest Workers (×3)   AI Workers (×2)   Score Workers (×1)
```

## 5.2 arXiv Ingestion Pipeline

```python
class ArxivIngestionPipeline:
    CATEGORIES = [
        'cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'cs.NE',
        'cs.RO', 'stat.ML', 'eess.AS', 'cs.IR', 'cs.MA'
    ]
    MAX_RESULTS_PER_CATEGORY = 100

    def run(self):
        for category in self.CATEGORIES:
            papers = self.fetch_recent(category)
            for paper in papers:
                if not self.bloom.contains(f"arxiv:{paper.arxiv_id}"):
                    normalized = self.normalize(paper)
                    self.upsert(normalized)
                    generate_embedding.delay(normalized.id)
                    generate_ai_summary.delay(normalized.id)
                    classify_category.delay(normalized.id)
                    find_github_implementations.delay(normalized.arxiv_id)

    def fetch_recent(self, category: str) -> List[ArxivPaper]:
        # arXiv Atom API — 3s sleep between requests (TOS compliance)
        params = {
            'search_query': f'cat:{category}',
            'start': 0,
            'max_results': self.MAX_RESULTS_PER_CATEGORY,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending'
        }
        time.sleep(3)
        response = requests.get(ARXIV_BASE_URL, params=params)
        return self.parse_atom(response.text)
```

**Dedup:** Redis Bloom filter for O(1) pre-check. PostgreSQL `UNIQUE(arxiv_id)` as authoritative guard.

**Backoff:** Exponential on HTTP 5xx — 2s, 4s, 8s, 16s, max 64s.

## 5.3 Hugging Face Ingestion Pipeline

```python
class HuggingFaceIngestionPipeline:
    SORT_BY = ['downloads', 'likes', 'lastModified']
    LIMIT = 500  # per sort dimension

    def run(self):
        seen_ids = set()
        for sort in self.SORT_BY:
            for model in self.fetch_models(sort=sort):
                if model.id not in seen_ids:
                    seen_ids.add(model.id)
                    self.upsert_model(model)
                    record_download_snapshot.delay(model.id)
                    parse_model_card.delay(model.id)
                    link_to_paper.delay(model.id)

    def link_to_paper(self, model_id: str):
        # Parse model card for arXiv IDs via regex
        card = fetch_model_card(model_id)
        arxiv_ids = re.findall(r'arxiv\.org/abs/(\d{4}\.\d{4,5})', card)
        for arxiv_id in arxiv_ids[:1]:
            paper = db.query(Paper).filter_by(arxiv_id=arxiv_id).first()
            if paper:
                db.execute("UPDATE models SET linked_paper_id=:pid WHERE hf_model_id=:mid",
                           {"pid": paper.id, "mid": model_id})
```

## 5.4 GitHub Ingestion Pipeline

```python
class GitHubIngestionPipeline:
    SEARCH_QUERIES = [
        'topic:arxiv language:python stars:>50',
        'topic:machine-learning topic:research stars:>100',
        '"paper implementation" language:python stars:>30',
    ]

    def run(self):
        for query in self.SEARCH_QUERIES:
            for repo in self.search_repos(query):
                self.upsert_repo(repo)
                self.try_link_to_paper(repo)

    def try_link_to_paper(self, repo: GitHubRepo):
        readme = fetch_readme(repo.full_name)
        arxiv_ids = re.findall(r'arxiv\.org/abs/(\d{4}\.\d{4,5})', readme)
        if not arxiv_ids:
            arxiv_ids = re.findall(r'\d{4}\.\d{4,5}', repo.description or '')
        for arxiv_id in arxiv_ids[:1]:
            paper = db.query(Paper).filter_by(arxiv_id=arxiv_id).first()
            if paper:
                db.execute("UPDATE repositories SET linked_paper_id=:pid WHERE github_full_name=:name",
                           {"pid": paper.id, "name": repo.full_name})
                create_kg_edge('repository', repo.id, 'paper', paper.id, 'implements')
```

## 5.5 AI Summary Generation Pipeline

```python
SUMMARY_PROMPT = """You are a research analyst. Analyze this AI paper and return ONLY valid JSON:

Title: {title}
Abstract: {abstract}

{{
  "core_contribution": "1-2 sentences on the main technical contribution",
  "key_innovation": "What is genuinely new vs prior work",
  "problem_solved": "The specific problem addressed",
  "practical_applications": ["app1", "app2", "app3"],
  "limitations": ["limit1", "limit2"],
  "significance": "low|medium|high|breakthrough",
  "significance_rationale": "Why this level",
  "related_concepts": ["concept1", "concept2", "concept3"]
}}

Rules: Be specific. Do not invent metrics. Significance must be justified."""

class AISummaryWorker:
    def process(self, paper_id: str):
        paper = db.get(Paper, paper_id)
        if paper.ai_summary:
            return
        try:
            response = anthropic_client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                messages=[{"role": "user", "content": SUMMARY_PROMPT.format(
                    title=paper.title, abstract=paper.abstract[:3000])}]
            )
            summary = json.loads(response.content[0].text)
            SummarySchema(**summary)  # Pydantic validation
            db.execute("UPDATE papers SET ai_summary=:s, ai_summary_generated_at=NOW() WHERE id=:id",
                       {"s": json.dumps(summary), "id": paper_id})
        except (json.JSONDecodeError, ValidationError):
            self.process_with_sonnet(paper)   # fallback for complex papers
        except anthropic.RateLimitError:
            raise self.retry(countdown=60)
```

**Cost estimate at MVP scale (500 papers/day, Haiku):** ~$0.30/day. Negligible.

## 5.6 Embedding Generation

```python
class EmbeddingWorker:
    MODEL = "text-embedding-3-small"  # 1536 dims
    BATCH_SIZE = 100

    def process_batch(self, paper_ids: List[str]):
        papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
        texts = [f"{p.title}\n\n{p.abstract}" for p in papers]
        response = openai_client.embeddings.create(model=self.MODEL, input=texts)
        for paper, emb in zip(papers, response.data):
            db.execute("UPDATE papers SET abstract_embedding=:e WHERE id=:id",
                       {"e": emb.embedding, "id": paper.id})
```

**Cost:** ~$0.003/day at 500 papers. Negligible.

## 5.7 Reliability Design

| Concern | Mechanism |
|---|---|
| Task retry | Celery `autoretry_for`, max 3, exponential backoff 2s base |
| Dead letter queue | Failed tasks → Redis list `dlq:{queue}`, alert if depth > 100 |
| Circuit breaker | If source returns 5xx × 5 consecutive → pause worker 30min |
| Data quality | Pydantic validation on every ingested record; rejects logged |
| Duplicate prevention | Bloom filter (Redis) + DB UNIQUE constraint |
| Orphan cleanup | Nightly job: delete embeddings for deleted papers |
| View refresh | Materialized views refreshed hourly via Celery beat |

---

## 5.8 Research Intelligence Engine Pipeline (Layer 3 — flagship, 1.4.8)

Unlike 5.2–5.6, this pipeline never talks to an external API. It reads only from tables Layers 1–2 already populated and writes to the Layer 3 tables added in 3.1. It runs as its own Celery queue (`intelligence`) so a slow reasoning job never blocks paper ingestion.

```python
class IntelligenceEnginePipeline:
    """Orchestrates all Layer 3 jobs. Each stage is independently retryable
    and reads/writes only Layer 3 tables plus read-only queries against
    Layer 1-2 tables — it never mutates papers/models/repositories directly."""

    def run_daily(self):
        compute_research_dna.delay()                # 1.4.8.5 — new papers only
        compute_breakthrough_scores.delay()          # 1.4.8.3
        compute_influence_scores.delay()             # 1.4.8.8

    def run_weekly(self):
        build_idea_propagation_chains.delay()        # 1.4.8.1
        build_research_genealogy.delay()              # 1.4.8.2
        detect_cross_pollination.delay()               # 1.4.8.4
        update_evolution_timelines.delay()             # 1.4.8.6
        detect_collaboration_clusters.delay()           # 1.4.8.7
        train_and_score_frontier_predictor.delay()       # 1.4.8.9

    def run_on_period_close(self):
        generate_research_narrative.delay(scope="global")     # 1.4.8.10
        for category in active_categories():
            generate_research_narrative.delay(scope="category", scope_ref=category.slug)
```

**Scheduling (Celery beat additions to 5.1):**

```
Daily  03:00 UTC → Research DNA decomposition for papers ingested in prior 24h
Daily  04:00 UTC → Emerging Breakthrough Score + Research Influence Score recompute
                    (runs after 04:00 nightly Impact/Momentum/Innovation batch, 3.3)
Weekly Sun 02:00 UTC → Idea Propagation, Genealogy, Cross-Pollination, Evolution Timeline
Weekly Sun 03:00 UTC → Collaboration cluster detection (Louvain over org graph)
Weekly Sun 04:00 UTC → Frontier Predictor retrain + score (feeds into Mon 06:00 briefing, 1.4.5)
Mon    05:30 UTC → Research Storytelling narrative generation (before 06:00 Weekly Briefing,
                    so the narrative can be embedded inside it — 1.4.8.10)
```

**Why Research DNA runs before everything else in the pipeline:** Idea Propagation, Genealogy, Cross-Pollination, and Evolution Timeline all key off concept labels — they cannot run for a paper until its Research DNA (1.4.8.5) exists. The daily DNA job is deliberately scheduled hours before the weekly reasoning jobs.

**Reliability:** Same patterns as 5.7 — `autoretry_for` with exponential backoff, DLQ on `dlq:intelligence`, and a circuit breaker on the Claude API calls used by DNA decomposition (1.4.8.5) and Narrative generation (1.4.8.10). Frontier Predictor training (1.4.8.9) runs on scikit-learn locally — no external API, so no circuit breaker needed there.

**Cost estimate:** Research DNA decomposition and Narrative generation are the only two Layer 3 jobs that call Claude. At MVP scale (≈500 papers/day for DNA, 1 global + 15 category narratives/week), incremental cost is **~$0.15/day** — folded into the existing AI budget (5.5).

---

# PART 6 — FOLDER STRUCTURE

## 6.1 Repository Layout

```
ai-research-radar/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # FastAPI backend
├── packages/
│   └── shared-types/           # Shared TypeScript types (future)
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   └── docker-compose.yml
│   └── scripts/
│       ├── seed_categories.py
│       └── backfill_scores.py
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── docs/
    └── adr/
```

## 6.2 Frontend (`apps/web/`)

```
apps/web/src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root: theme, fonts, providers
│   ├── page.tsx                      # Dashboard / Homepage
│   ├── papers/
│   │   ├── page.tsx                  # Research Explorer
│   │   └── [id]/page.tsx             # Paper Intelligence
│   ├── trends/
│   │   ├── page.tsx                  # Trend Radar
│   │   └── [category]/page.tsx
│   ├── models/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── graph/page.tsx
│   ├── intelligence/                 # Research Intelligence Engine (Layer 3 — flagship, 1.4.8)
│   │   ├── page.tsx                  # Engine home: sleeping giants, frontier, narratives
│   │   ├── propagation/[seedId]/page.tsx
│   │   ├── genealogy/[paperId]/page.tsx
│   │   ├── sleeping-giants/page.tsx
│   │   ├── cross-pollination/[concept]/page.tsx
│   │   ├── dna/[paperId]/page.tsx
│   │   ├── evolution/[concept]/page.tsx
│   │   ├── collaborations/page.tsx
│   │   └── frontier/page.tsx
│   ├── briefings/
│   │   ├── page.tsx
│   │   └── [week]/page.tsx
│   └── api/                          # Next.js route handlers (proxy + auth)
│       ├── papers/route.ts
│       ├── trends/route.ts
│       ├── models/route.ts
│       ├── search/route.ts
│       ├── graph/route.ts
│       ├── intelligence/route.ts     # proxies /api/v1/intelligence/*
│       ├── briefings/route.ts
│       └── dashboard/route.ts
│
├── components/
│   ├── dashboard/
│   │   ├── TrendingPapersPanel.tsx
│   │   ├── EmergingAreasPanel.tsx
│   │   ├── BreakoutModelsPanel.tsx
│   │   ├── WeeklyBriefingCard.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   └── BenchmarkWatchPanel.tsx
│   ├── papers/
│   │   ├── PaperCard.tsx
│   │   ├── PaperCardSkeleton.tsx
│   │   ├── PaperDetail.tsx
│   │   ├── AISummaryPanel.tsx
│   │   ├── PaperMetrics.tsx
│   │   ├── CitationChart.tsx
│   │   └── RelatedPapers.tsx
│   ├── trends/
│   │   ├── RadarVisualization.tsx    # SVG radar chart
│   │   ├── CategoryCard.tsx
│   │   ├── TrendSparkline.tsx
│   │   └── CategoryTimeline.tsx
│   ├── models/
│   │   ├── ModelCard.tsx
│   │   ├── DownloadChart.tsx
│   │   └── ModelDetail.tsx
│   ├── graph/
│   │   ├── KnowledgeGraph.tsx        # D3 force-directed
│   │   ├── GraphControls.tsx
│   │   └── NodeTooltip.tsx
│   ├── intelligence/                 # Layer 3 — flagship, 1.4.8
│   │   ├── PropagationChain.tsx      # 1.4.8.1 — vertical chain, org-by-org
│   │   ├── GenealogyTree.tsx         # 1.4.8.2 — expandable family tree
│   │   ├── SleepingGiantsPanel.tsx   # 1.4.8.3 — ranked cards + driver badge
│   │   ├── CrossPollinationMap.tsx   # 1.4.8.4 — category-hopping timeline
│   │   ├── ResearchDNAChart.tsx      # 1.4.8.5 — donut/radial concept weights
│   │   ├── DNASimilarityPanel.tsx    # 1.4.8.5 — "similar DNA" comparison
│   │   ├── EvolutionTimeline.tsx     # 1.4.8.6 — horizontal stage tracker
│   │   ├── CollaborationClusterGraph.tsx  # 1.4.8.7 — org-to-org cluster view
│   │   ├── InfluenceScoreBreakdown.tsx    # 1.4.8.8 — stacked component bar
│   │   ├── FrontierPredictorPanel.tsx     # 1.4.8.9 — ranked categories + signals
│   │   └── NarrativeCard.tsx         # 1.4.8.10 — AI storytelling, entity links
│   ├── search/
│   │   ├── CommandPalette.tsx        # Cmd+K global search
│   │   ├── SearchResults.tsx
│   │   └── FilterBar.tsx
│   └── ui/                           # shadcn/ui overrides + custom
│       ├── ScoreRing.tsx             # Animated score circle
│       ├── Sparkline.tsx             # Mini trend line
│       ├── CategoryBadge.tsx
│       └── GrowthBadge.tsx           # "+14% this week"
│
├── hooks/
│   ├── usePapers.ts
│   ├── useTrends.ts
│   ├── useSearch.ts
│   ├── useGraph.ts
│   ├── useIntelligence.ts            # Layer 3 — 1.4.8 endpoints
│   └── useCommandPalette.ts
│
├── lib/
│   ├── api.ts                        # Typed fetch wrapper
│   ├── formatters.ts
│   ├── constants.ts
│   └── utils.ts
│
├── stores/
│   └── filters.ts                    # Zustand: filter state
│
└── types/
    ├── paper.ts
    ├── model.ts
    ├── trend.ts
    └── graph.ts
```

## 6.3 Backend (`apps/api/`)

```
apps/api/src/
├── main.py                           # FastAPI factory
├── config.py                         # Pydantic Settings
├── database.py                       # SQLAlchemy engine + session
├── redis_client.py
├── celery_app.py
│
├── models/                           # SQLAlchemy ORM
│   ├── paper.py
│   ├── author.py
│   ├── organization.py
│   ├── research_category.py
│   ├── hf_model.py
│   ├── repository.py
│   ├── trend_snapshot.py
│   ├── weekly_report.py
│   ├── knowledge_graph_edge.py
│   └── intelligence/                 # Layer 3 ORM models — 1.4.8
│       ├── paper_concept_composition.py
│       ├── paper_intelligence_scores.py
│       ├── evolution_timeline_event.py
│       ├── collaboration_cluster.py
│       ├── frontier_prediction.py
│       └── research_narrative.py
│
├── schemas/                          # Pydantic I/O schemas
│   ├── paper.py
│   ├── model.py
│   ├── trend.py
│   ├── graph.py
│   ├── search.py
│   ├── briefing.py
│   └── intelligence.py               # 1.4.8 request/response schemas
│
├── routers/                          # FastAPI routers
│   ├── papers.py
│   ├── trends.py
│   ├── models.py
│   ├── search.py
│   ├── graph.py
│   ├── briefings.py
│   ├── dashboard.py
│   ├── intelligence.py               # /api/v1/intelligence/* — 1.4.8
│   └── internal.py
│
├── services/                         # Business logic
│   ├── paper_service.py
│   ├── trend_service.py
│   ├── model_service.py
│   ├── search_service.py
│   ├── graph_service.py
│   ├── score_service.py
│   ├── briefing_service.py
│   └── intelligence/                 # Layer 3 — flagship, 1.4.8
│       ├── dna_service.py            # 1.4.8.5
│       ├── propagation_service.py    # 1.4.8.1
│       ├── genealogy_service.py      # 1.4.8.2
│       ├── breakthrough_service.py   # 1.4.8.3
│       ├── cross_pollination_service.py  # 1.4.8.4
│       ├── evolution_service.py      # 1.4.8.6
│       ├── collaboration_service.py  # 1.4.8.7
│       ├── influence_service.py      # 1.4.8.8
│       ├── frontier_service.py       # 1.4.8.9
│       └── narrative_service.py      # 1.4.8.10
│
├── workers/                          # Celery tasks
│   ├── ingestion/
│   │   ├── arxiv.py
│   │   ├── huggingface.py
│   │   └── github.py
│   ├── ai/
│   │   ├── summary.py
│   │   ├── embedding.py
│   │   └── briefing.py
│   ├── scoring/
│   │   ├── paper_scores.py
│   │   ├── trend_scores.py
│   │   └── model_scores.py
│   ├── graph/
│   │   └── edge_builder.py
│   ├── intelligence/                 # queue: "intelligence" — see 5.8
│   │   ├── dna.py                    # compute_research_dna
│   │   ├── breakthrough.py           # compute_breakthrough_scores
│   │   ├── influence.py              # compute_influence_scores
│   │   ├── propagation.py            # build_idea_propagation_chains
│   │   ├── genealogy.py              # build_research_genealogy
│   │   ├── cross_pollination.py      # detect_cross_pollination
│   │   ├── evolution.py              # update_evolution_timelines
│   │   ├── collaboration.py          # detect_collaboration_clusters
│   │   ├── frontier.py               # train_and_score_frontier_predictor
│   │   └── narrative.py              # generate_research_narrative
│   └── maintenance/
│       ├── refresh_views.py
│       └── cleanup.py
│
├── middleware/
│   ├── auth.py
│   ├── rate_limit.py
│   └── logging.py
│
└── utils/
    ├── pagination.py                 # Cursor pagination
    ├── cache.py                      # Redis decorators
    ├── scoring.py
    └── text.py

migrations/
    versions/
        0001_initial_schema.py
        0002_add_vector_index.py
        0003_add_materialized_views.py

tests/
    unit/
    integration/
    fixtures/
```

---

# PART 7 — UI WIREFRAMES

## 7.1 Homepage / Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔭 AI Research Radar          [Search...  ⌘K]        [Briefing] [⚙]  │
│─────────────────────────────────────────────────────────────────────────│
│                                                                         │
│  BENTO GRID ROW 1                                                       │
│  ┌────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  🔥 TRENDING NOW           │  │  📡 EMERGING AREAS              │   │
│  │  ─────────────────────     │  │  ─────────────────────────────  │   │
│  │  1. [Title truncated...]   │  │  AI Agents      ████████ +94%   │   │
│  │     LLMs • 143 citations   │  │  Reasoning      ███████  +81%   │   │
│  │     ▲ 12 GitHub impls      │  │  MCP Ecosystem  ██████   +72%   │   │
│  │                            │  │  Multimodal     █████    +61%   │   │
│  │  2. [Title truncated...]   │  │  Coding Agents  █████    +58%   │   │
│  │     Agents • 87 citations  │  │                                  │   │
│  │     ▲ 8 GitHub impls       │  │  [View Radar →]                 │   │
│  │                            │  └─────────────────────────────────┘   │
│  │  3. [Title truncated...]   │                                         │
│  │  [View all 10 →]           │                                         │
│  └────────────────────────────┘                                         │
│                                                                         │
│  BENTO GRID ROW 2                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  ⚡ BREAKOUT      │  │  📅 THIS WEEK    │  │  🗓 ACTIVITY HEATMAP │  │
│  │  MODELS           │  │  IN NUMBERS      │  │                      │  │
│  │  ──────────────── │  │  ──────────────  │  │  Jun ░░▒▒▓▓██▓▒░░   │  │
│  │  Qwen3-72B        │  │  847 papers      │  │  cs.CL ██████████   │  │
│  │  +340K dl (7d)   │  │  134 models      │  │  cs.AI ████████      │  │
│  │  ▲▲▲▲▲           │  │  29 benchmarks   │  │  cs.CV ██████        │  │
│  │                   │  │  3 breakthroughs │  │  cs.LG █████         │  │
│  │  Gemma-3-9B       │  │                  │  │  cs.RO ████          │  │
│  │  +180K dl (7d)   │  │  [Read Briefing] │  └──────────────────────┘  │
│  │  [View all →]     │  └──────────────────┘                            │
│  └──────────────────┘                                                   │
│                                                                         │
│  BENTO GRID ROW 3 — WEEKLY BRIEFING PREVIEW                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  📋 WEEKLY AI BRIEFING — Week of June 16, 2026                   │  │
│  │  ────────────────────────────────────────────────────────────── │  │
│  │  The biggest story this week: DeepSeek released a new reasoning  │  │
│  │  model that achieves competitive performance on MATH-500 with    │  │
│  │  only 7B parameters... [Read full briefing →]                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7.2 Paper Intelligence Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back    arXiv:2401.12345                          [Share] [Bookmark] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HEADER ZONE                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Scaling Language Models: Methods, Analysis & Insights from...    │  │
│  │  Kaplan J., McCandlish S., Henighan T. et al. • OpenAI           │  │
│  │  Jan 23, 2024  •  [LLMs ×]  [Scaling ×]  [Transformers ×]       │  │
│  │                                                                   │  │
│  │  ◉ 87.4   Impact ◯72   Momentum ◯91   Innovation ◯68            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  TWO-COLUMN LAYOUT                                                      │
│  ┌────────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  AI RESEARCH SUMMARY               │  │  METRICS                  │  │
│  │  ──────────────────────────────    │  │  ─────────────────────    │  │
│  │  Core Contribution                 │  │  Citations      143       │  │
│  │  This paper demonstrates that...   │  │  7-day delta   +12 ▲     │  │
│  │                                    │  │                           │  │
│  │  Key Innovation                    │  │  GitHub Impls    12       │  │
│  │  Unlike prior work which...        │  │  Stars (top)  4.2K       │  │
│  │                                    │  │                           │  │
│  │  Problem Solved                    │  │  HF Models       3        │  │
│  │  Training costs at scale...        │  │  Downloads    840K        │  │
│  │                                    │  │                           │  │
│  │  Practical Applications            │  │  Social           47      │  │
│  │  • Model selection for budget      │  │  HN score        312      │  │
│  │  • Infrastructure planning         │  │                           │  │
│  │  • Research prioritization         │  │  CITATION TREND           │  │
│  │                                    │  │  ┌───────────────────┐    │  │
│  │  Limitations                       │  │  │    ___           │    │  │
│  │  • Based on compute at 2020 prices │  │  │   /   \_         │    │  │
│  │  • Does not generalize to...       │  │  │  /      \___     │    │  │
│  │                                    │  │  └──jan──feb──mar──┘    │  │
│  │  Significance: ★★★★ HIGH           │  │                           │  │
│  └────────────────────────────────────┘  └───────────────────────────┘  │
│                                                                         │
│  RELATED PAPERS                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  [Paper card] [Paper card] [Paper card] [Paper card] →            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  KNOWLEDGE GRAPH MINI (D3, click to expand)                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │          ○ Chinchilla          ○ GPT-4 TR                         │  │
│  │         /                     /                                   │  │
│  │   ● THIS PAPER ─────────── ○ Gopher                              │  │
│  │         \                                                         │  │
│  │          ○ LLaMA (cites this)  [Open full graph →]               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7.3 Research Trend Radar

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Research Trend Radar              [This Week ▾]  [7d / 30d / 90d]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────┐                   │
│  │         RADAR CHART (SVG, interactive)          │                   │
│  │                                                  │                   │
│  │              AI Agents                           │                   │
│  │                 ▲                                │                   │
│  │    MCP ◄────────●────────► LLMs                 │                   │
│  │    Ecosystem     \    /    (outer = high)        │                   │
│  │                  Reasoning                       │                   │
│  │                                                  │                   │
│  │  ● = current week  ○ = last week                 │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                         │
│  CATEGORY GRID                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  AI Agents       │  │  LLMs            │  │  Reasoning Models    │  │
│  │  Growth  ████ 94 │  │  Growth  ███  81 │  │  Growth  ████    88  │  │
│  │  Momentum     88 │  │  Momentum     79 │  │  Momentum        84  │  │
│  │  234 papers/wk   │  │  412 papers/wk   │  │  98 papers/wk        │  │
│  │  ▲ +12% vs last  │  │  ▲ +5% vs last   │  │  ▲ +18% vs last      │  │
│  │  [Explore →]     │  │  [Explore →]     │  │  [Explore →]         │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│  (continues for all 15 categories, sorted by growth score)             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7.4 Knowledge Graph Explorer

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Knowledge Graph      [Papers] [Authors] [Orgs] [Models]  [Reset]     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │   ○ (author)         ● (paper, selected)                        │   │
│  │    \                / | \                                        │   │
│  │     ○──────────────●  │  ○ (model)                              │   │
│  │    (org)           |  │   \                                      │   │
│  │                    ○  ○    ○ (repo)                              │   │
│  │                (cites) (cites)                                   │   │
│  │                                                                  │   │
│  │  [Zoom +/-]  [Filter edges ▾]  [Expand neighbors]  [Export]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SELECTED NODE PANEL (right sidebar on click)                          │
│  ┌───────────────────────────────┐                                      │
│  │  ● Attention Is All You Need  │                                      │
│  │  Vaswani et al., Google 2017  │                                      │
│  │  Composite Score: 99.1        │                                      │
│  │  Citations: 87,000+           │                                      │
│  │  Connections: 1,247 nodes     │                                      │
│  │  [Open Paper Page →]          │                                      │
│  └───────────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7.5 Command Palette (Cmd+K)

```
┌─────────────────────────────────────────────────────────────┐
│  ⌘K  🔍  Search papers, models, topics...                  │
│─────────────────────────────────────────────────────────────│
│  RECENT                                                     │
│  📄  Attention Is All You Need                             │
│  📊  AI Agents trend                                        │
│  🤖  Llama-3-8B                                             │
│─────────────────────────────────────────────────────────────│
│  QUICK ACTIONS                                              │
│  → Go to Trend Radar                                        │
│  → Read Weekly Briefing                                     │
│  → Open Knowledge Graph                                     │
│─────────────────────────────────────────────────────────────│
│  [Type to search...]          ESC to close                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.6 Research Intelligence Engine (Layer 3 — flagship, 1.4.8)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧠 Research Intelligence Engine        [Propagation] [Genealogy]      │
│     "Why is it happening, where is it going, what does it mean?"       │
│                                          [Cross-Pollination] [Frontier] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  💤 SLEEPING GIANTS (1.4.8.3)                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  1. [Title truncated...]         Score 88.4  ●●●●●●●●○○           │  │
│  │     12 citations · GitHub impls +340% this month                  │  │
│  │     "Three independent labs shipped inference-optimized forks     │  │
│  │      in the last three weeks."                          [Open →] │  │
│  │  2. [Title truncated...]         Score 81.2  ●●●●●●●●○○           │  │
│  │  [View all 10 →]                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  🧬 IDEA PROPAGATION — "Mixture of Experts"  (1.4.8.1)                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Google ──▶ DeepMind ──▶ Alibaba ──▶ Open Source ──▶ Commercial   │  │
│  │  2017      2020         2024        2024 (40+ repos)  2024        │  │
│  │  [Explore full chain →]  [Try another concept: search box]        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────┐  ┌───────────────────────────────┐   │
│  │  🧫 RESEARCH DNA (1.4.8.5)    │  │  🔮 FRONTIER PREDICTOR (1.4.8.9)│   │
│  │  ────────────────────────    │  │  ─────────────────────────────  │   │
│  │  Selected paper:               │  │  Agentic AI      ▓▓▓▓▓▓▓▓░ 82% │   │
│  │  ◐ 65% Retrieval              │  │  Reasoning       ▓▓▓▓▓▓░░░ 64% │   │
│  │  ◑ 20% Multi-agent            │  │  MCP Ecosystem   ▓▓▓▓▓░░░░ 58% │   │
│  │  ◒ 10% RL                     │  │  probability of >50% growth    │   │
│  │  ◓  5% Formal verification    │  │  within 24 weeks. Top signal:  │   │
│  │  [Compare similar DNA →]      │  │  submission velocity ▲         │   │
│  └──────────────────────────────┘  └───────────────────────────────┘   │
│                                                                         │
│  📖 RESEARCH STORYTELLING (1.4.8.10)                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  AI Agents — Last 6 Months                                        │  │
│  │  "The last six months have seen a shift from pure reasoning        │  │
│  │  models toward agentic workflows. This began with [[DeepSeek-R1]], │  │
│  │  accelerated after tool-use benchmarks showed agentic approaches   │  │
│  │  outperforming chain-of-thought alone, and today multi-step agent  │  │
│  │  frameworks dominate new implementations."          [Read more →] │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Genealogy, Cross-Pollination, Evolution Timeline, Hidden Collaborations, and Influence Score breakdown** each get a dedicated full-page view (routes in 6.2) reusing the chain/tree visual language established above — a vertical tree for Genealogy (1.4.8.2), a horizontal category-hop timeline for Cross-Pollination (1.4.8.4) and Evolution Timeline (1.4.8.6), and an org-to-org cluster graph (D3, same engine as 7.4) for Hidden Collaborations (1.4.8.7).

---

# PART 8 — DESIGN SYSTEM

## 8.1 Color Palette

```
BACKGROUNDS (dark-first)
  --bg-base:        #0a0a0f    /* near-black, page background */
  --bg-surface:     #111118    /* cards, panels */
  --bg-elevated:    #1a1a26    /* modals, dropdowns */
  --bg-subtle:      #1f1f2e    /* hover states, alternate rows */

BORDERS
  --border-base:    #252535    /* card borders */
  --border-strong:  #363650    /* focused/active elements */

TEXT
  --text-primary:   #f0f0ff    /* headings, important content */
  --text-secondary: #9090b0    /* metadata, labels */
  --text-tertiary:  #5a5a78    /* placeholder, disabled */
  --text-inverse:   #0a0a0f    /* text on light backgrounds */

BRAND / ACCENT
  --accent-primary: #6366f1    /* indigo — primary CTA, links */
  --accent-hover:   #818cf8    /* lighter on hover */
  --accent-subtle:  #1e1e3f    /* low-opacity accent backgrounds */

CATEGORY COLORS (semantic, consistent across UI)
  --cat-llms:       #6366f1    /* indigo */
  --cat-agents:     #f59e0b    /* amber */
  --cat-reasoning:  #10b981    /* emerald */
  --cat-vision:     #3b82f6    /* blue */
  --cat-multimodal: #8b5cf6    /* violet */
  --cat-robotics:   #ef4444    /* red */
  --cat-rl:         #ec4899    /* pink */
  --cat-infra:      #6b7280    /* gray */
  --cat-rag:        #14b8a6    /* teal */
  --cat-speech:     #f97316    /* orange */
  --cat-coding:     #84cc16    /* lime */
  --cat-mcp:        #a78bfa    /* purple */
  --cat-synth:      #06b6d4    /* cyan */
  --cat-evals:      #fbbf24    /* yellow */

STATUS / SEMANTIC
  --success:        #22c55e
  --warning:        #f59e0b
  --error:          #ef4444
  --info:           #3b82f6

SCORE COLORS (gradient)
  0–40   → #ef4444  (low, red)
  40–60  → #f59e0b  (medium, amber)
  60–80  → #3b82f6  (good, blue)
  80–100 → #22c55e  (high, green)
```

## 8.2 Typography

```
Font stack:
  Headings:    "Inter", system-ui, sans-serif   (variabl