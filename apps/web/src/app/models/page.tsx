"use client";

import { useState } from "react";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { Button } from "@/components/ui/Button";
import { ModelCard, ModelCardSkeleton } from "@/components/models/ModelCard";
import { useModels } from "@/hooks/useModels";
import { MODEL_SORT_OPTIONS, MODEL_TYPES, CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/formatters";

const selectClass =
  "h-9 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]";

export default function ModelsPage() {
  const [sort, setSort] = useState(MODEL_SORT_OPTIONS[0]?.value ?? "growth_score");
  const [modelType, setModelType] = useState("");
  const [category, setCategory] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useModels({
    sort,
    model_type: modelType || undefined,
    category: category || undefined,
  });

  const models = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.pagination?.total_count ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Cross-Source Fusion"
        title="Model Radar"
        description="Track model adoption velocity on Hugging Face."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={selectClass}
          aria-label="Sort models"
        >
          {MODEL_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
          className={selectClass}
          aria-label="Filter by model type"
        >
          <option value="">All types</option>
          {MODEL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {!isLoading && !isError && (
          <span className="ml-auto text-xs text-[var(--text-tertiary)]">
            {formatNumber(totalCount)} models
          </span>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ModelCardSkeleton key={i} />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No models found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model, i) => (
              <ModelCard key={model.id} model={model} index={i} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
