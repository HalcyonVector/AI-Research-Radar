"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { MousePointerClick, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { nodeColor } from "@/components/graph/graphColors";
import { useAuthorGraph, useCategoryGraph, usePaperGraph } from "@/hooks/useGraph";
import { CATEGORIES, getCategory } from "@/lib/constants";
import type { GraphNode } from "@/types/graph";

const selectClass =
  "h-9 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]";

type SeedType = "category" | "paper" | "author";

// deep-link support: /graph?seed=paper&id=<uuid> (from a paper's "Open in
// graph" button) or /graph?seed=author&id=<uuid> (from an author's page)
function initialSeedFromUrl(params: URLSearchParams): { seedType: SeedType; id: string } {
  const seed = params.get("seed");
  const id = params.get("id") ?? "";
  if ((seed === "paper" || seed === "author") && id) return { seedType: seed, id };
  return { seedType: "category", id: "" };
}

export default function GraphPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <GraphPageInner />
    </Suspense>
  );
}

function GraphPageInner() {
  const searchParams = useSearchParams();
  const initial = initialSeedFromUrl(searchParams);

  const [seedType, setSeedType] = useState<SeedType>(initial.seedType);
  const [selectedSlug, setSelectedSlug] = useState<string>(CATEGORIES[0]?.slug ?? "llms");
  const [paperId, setPaperId] = useState<string>(initial.seedType === "paper" ? initial.id : "");
  const [authorId, setAuthorId] = useState<string>(initial.seedType === "author" ? initial.id : "");
  const [depth, setDepth] = useState<number>(2);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const categoryQuery = useCategoryGraph(selectedSlug, depth);
  const paperQuery = usePaperGraph(paperId, depth);
  const authorQuery = useAuthorGraph(authorId, depth);

  const active = seedType === "category" ? categoryQuery : seedType === "paper" ? paperQuery : authorQuery;
  const data = active.data;
  const seedId = seedType === "paper" ? paperId : seedType === "author" ? authorId : selectedSlug;
  const loading = seedType !== "category" && !seedId ? false : active.isLoading;
  const error = active.isError;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Cross-Source Fusion"
        title="Knowledge Graph"
        description="Explore how papers, models, authors and concepts connect across the ecosystem."
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <select
            className={selectClass}
            value={seedType}
            onChange={(e) => {
              setSeedType(e.target.value as SeedType);
              setSelected(null);
            }}
            aria-label="Seed type"
          >
            <option value="category">Seed: Category</option>
            <option value="paper">Seed: Paper</option>
            <option value="author">Seed: Author</option>
          </select>

          {seedType === "category" ? (
            <select
              className={selectClass}
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setSelected(null);
              }}
              aria-label="Category"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : seedType === "paper" ? (
            <input
              className={`${selectClass} w-56`}
              placeholder="Paper ID…"
              value={paperId}
              onChange={(e) => {
                setPaperId(e.target.value.trim());
                setSelected(null);
              }}
              aria-label="Paper ID"
            />
          ) : (
            <input
              className={`${selectClass} w-56`}
              placeholder="Author ID…"
              value={authorId}
              onChange={(e) => {
                setAuthorId(e.target.value.trim());
                setSelected(null);
              }}
              aria-label="Author ID"
            />
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Graph */}
        <div className="lg:col-span-3">
          <Card className="p-0">
            <KnowledgeGraph
              data={data}
              loading={loading}
              error={error}
              onRetry={() => active.refetch()}
              height={620}
              onNodeClick={setSelected}
              selectedNodeId={selected?.id ?? null}
              depth={depth}
              onDepthChange={setDepth}
            />
          </Card>
        </div>

        {/* Selected node panel */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6">
            <CardTitle className="mb-4">Selected node</CardTitle>
            {selected ? (
              <SelectedNodePanel node={selected} />
            ) : (
              <EmptyState
                icon={MousePointerClick}
                compact
                title="Click a node to inspect"
                description="Select any node in the graph to see its details and open the related page."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SelectedNodePanel({ node }: { node: GraphNode }) {
  const hasScore = typeof node.score === "number" && !Number.isNaN(node.score);
  const color = nodeColor(node);

  let href: string | null = null;
  let hrefLabel = "";
  if (node.type === "paper") {
    href = `/papers/${node.id}`;
    hrefLabel = "Open paper";
  } else if (node.type === "category") {
    const slug = node.category ?? node.id;
    href = `/trends/${slug}`;
    hrefLabel = "View trend";
  } else if (node.type === "model") {
    href = `/models/${node.id}`;
    hrefLabel = "Open model";
  } else if (node.type === "author") {
    href = `/authors/${node.id}`;
    hrefLabel = "Open author";
  }

  const catDef = node.category ? getCategory(node.category) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-snug text-[var(--text-primary)]">
            {node.label}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className="capitalize" color={color} variant="soft">
              {node.type}
            </Badge>
            {catDef && (
              <Badge color={catDef.color} variant="soft">
                {catDef.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasScore && (
        <div className="flex items-center justify-center rounded-lg border border-[var(--border-base)] bg-[var(--bg-elevated)] py-4">
          <ScoreRing score={node.score as number} size={92} label="Score" />
        </div>
      )}

      {href && (
        <Link
          href={href}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          {hrefLabel}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  );
}
