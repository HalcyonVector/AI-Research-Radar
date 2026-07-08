"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { PaperCard } from "@/components/papers/PaperCard";
import {
  useWatches,
  useCreateWatch,
  useDeleteWatch,
  useWatchDigest,
} from "@/hooks/useWatches";
import { useBookmarks, useDeleteBookmark } from "@/hooks/useBookmarks";
import { CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { Watch } from "@/types/paper";

function BookmarksSection() {
  const { data, isLoading, isError, refetch } = useBookmarks();
  const remove = useDeleteBookmark();
  const bookmarks = data?.data ?? [];

  return (
    <div>
      <SectionHeader title="Bookmarks" />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Use the Save button on any paper to keep it here."
        />
      ) : (
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
          {bookmarks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link
                href={`/papers/${b.entity_id}`}
                className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)] hover:underline"
              >
                <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {b.entity_type}
                </span>
                {b.note || b.entity_id}
              </Link>
              <button
                type="button"
                onClick={() => remove.mutate(b.id)}
                className="shrink-0 border border-[var(--rule-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DigestExpander({ watchId }: { watchId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useWatchDigest(watchId, open);
  const papers = data?.data ?? [];

  return (
    <div className="mt-3 border-t border-[var(--rule)] pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {open ? "Hide digest" : "Show digest"}
      </button>
      {open && (
        <div className="mt-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState compact onRetry={() => refetch()} />
          ) : papers.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Nothing new in this digest.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {papers.map((p) => (
                <PaperCard key={p.id} paper={p} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WatchRow({ watch }: { watch: Watch }) {
  const remove = useDeleteWatch();
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">{watch.label}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
            {watch.query && (
              <span className="font-mono">
                q: <span className="text-[var(--text-secondary)]">{watch.query}</span>
              </span>
            )}
            {watch.category_slug && (
              <span className="font-mono">
                cat: <span className="text-[var(--text-secondary)]">{watch.category_slug}</span>
              </span>
            )}
            {watch.created_at && <span>added {formatDate(watch.created_at)}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => remove.mutate(watch.id)}
          className="shrink-0 border border-[var(--rule-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          Remove
        </button>
      </div>
      <DigestExpander watchId={watch.id} />
    </Card>
  );
}

function WatchesSection() {
  const { data, isLoading, isError, refetch } = useWatches();
  const create = useCreateWatch();
  const watches = data?.data ?? [];

  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    create.mutate(
      {
        label: trimmed,
        query: query.trim() || undefined,
        category_slug: category || undefined,
      },
      {
        onSuccess: () => {
          setLabel("");
          setQuery("");
          setCategory("");
        },
      }
    );
  };

  const inputCls =
    "h-9 w-full border border-[var(--rule-strong)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--text-primary)] focus:outline-none";

  return (
    <div>
      <SectionHeader title="Topic Watches" />

      <Card className="mb-4">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Label
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Reasoning breakthroughs"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Query (optional)
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="self-verification"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Category (optional)
            </span>
            <div className="flex items-end gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls + " appearance-none"}
              >
                <option value="">Any</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" size="sm" disabled={!label.trim() || create.isPending}>
                Add
              </Button>
            </div>
          </label>
        </form>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : watches.length === 0 ? (
        <EmptyState
          title="No watches yet"
          description="Add a topic above to get a running digest of matching papers."
        />
      ) : (
        <div className="space-y-3">
          {watches.map((w) => (
            <WatchRow key={w.id} watch={w} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Your Radar"
        title="Watchlist"
        description="Saved papers and standing topic watches with fresh digests."
      />
      <BookmarksSection />
      <WatchesSection />
    </div>
  );
}
