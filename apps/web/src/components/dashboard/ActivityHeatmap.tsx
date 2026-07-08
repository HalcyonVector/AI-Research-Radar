"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { CATEGORIES, getCategory } from "@/lib/constants";
import { formatDate, formatDateShort, prettifySlug } from "@/lib/formatters";

interface HeatmapCell {
  category_slug: string;
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  loading?: boolean;
}

const MAX_DATES = 14;
const MAX_ROWS = 14;
const LABEL_COL_WIDTH = 128; // px, matches the `w-32` row-label column

export function ActivityHeatmap({ data, loading }: ActivityHeatmapProps) {
  const cells = data ?? [];

  // Distinct dates, sorted ascending, take last MAX_DATES.
  const allDates = Array.from(new Set(cells.map((c) => c.date))).sort();
  const dates = allDates.slice(-MAX_DATES);

  // Lookup map: `${slug}|${date}` -> count, plus a per-row (per-category) max
  // and total so a single outlier week/category doesn't wash out every other
  // non-zero cell, and so the bar view (below) can rank rows by activity.
  const lookup = new Map<string, number>();
  const rowMax = new Map<string, number>();
  const rowTotal = new Map<string, number>();
  for (const c of cells) {
    const key = `${c.category_slug}|${c.date}`;
    lookup.set(key, c.count);
    const prevMax = rowMax.get(c.category_slug) ?? 0;
    if (c.count > prevMax) rowMax.set(c.category_slug, c.count);
    rowTotal.set(c.category_slug, (rowTotal.get(c.category_slug) ?? 0) + c.count);
  }

  // Build rows from the slugs actually present in the data (backend slugs like
  // "reasoning-models"), so lookups match. Fall back to the constant list if empty.
  const dataSlugs = Array.from(new Set(cells.map((c) => c.category_slug)));
  const rowSlugs = (dataSlugs.length ? dataSlugs : CATEGORIES.map((c) => c.slug)).slice(0, MAX_ROWS);
  const categories = rowSlugs
    .map((slug) => {
      const def = getCategory(slug);
      return { slug, name: def.name === slug ? prettifySlug(slug) : def.name, color: def.color };
    })
    .sort((a, b) => (rowTotal.get(b.slug) ?? 0) - (rowTotal.get(a.slug) ?? 0));

  // With only 1-2 weekly buckets (true for a young dataset — there's simply no
  // history further back yet), a grid of colored cells degenerates into a wall
  // of solid color blocks with no visible pattern. A ranked bar chart of "papers
  // this period, by category" reads honestly instead of faking a time series.
  const isBarView = dates.length > 0 && dates.length <= 2;
  const latestDate = dates[dates.length - 1];
  const barMax = Math.max(1, ...categories.map((c) => rowTotal.get(c.slug) ?? 0));

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="Activity Heatmap" />
      <p className="-mt-2 mb-3 text-xs text-[var(--text-tertiary)]">
        {isBarView
          ? `Papers published per category, week of ${formatDate(latestDate)}`
          : "Papers published per category, by week"}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-20 shrink-0" />
              <div className="flex gap-[3px]">
                {Array.from({ length: MAX_DATES }).map((__, j) => (
                  <Skeleton key={j} className="h-[14px] w-[14px] rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : dates.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity data"
          description="Category activity will render here as papers are indexed."
          compact
        />
      ) : isBarView ? (
        <div className="space-y-2.5">
          {categories.map((cat) => {
            const count = rowTotal.get(cat.slug) ?? 0;
            const widthPct = count > 0 ? Math.max(4, (count / barMax) * 100) : 0;
            return (
              <div key={cat.slug} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-[11px] text-[var(--text-tertiary)]">
                  {cat.name}
                </span>
                <div className="h-5 flex-1 rounded-sm bg-[var(--bg-elevated)]">
                  <div
                    className="h-full rounded-sm transition-[width]"
                    style={{ width: `${widthPct}%`, backgroundColor: cat.color }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex items-center gap-3 pb-1.5">
              <span className="w-32 shrink-0" style={{ width: LABEL_COL_WIDTH }} />
              <div className="flex flex-1 gap-1.5">
                {dates.map((date) => (
                  <span
                    key={date}
                    className="flex-1 truncate text-center text-[10px] text-[var(--text-tertiary)]"
                  >
                    {formatDateShort(date)}
                  </span>
                ))}
              </div>
            </div>

            {categories.map((cat) => {
              const max = rowMax.get(cat.slug) ?? 0;
              return (
                <div key={cat.slug} className="flex items-center gap-3 py-[3px]">
                  <span
                    className="shrink-0 truncate text-[11px] text-[var(--text-tertiary)]"
                    style={{ width: LABEL_COL_WIDTH }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex flex-1 gap-1.5">
                    {dates.map((date) => {
                      const count = lookup.get(`${cat.slug}|${date}`) ?? 0;
                      // Log scale within the row's own range so a single busy week
                      // doesn't compress every other non-zero cell toward the floor.
                      const intensity =
                        max > 0 ? Math.log1p(count) / Math.log1p(max) : 0;
                      const opacity = count > 0 ? 0.22 + intensity * 0.78 : 0;
                      return (
                        <div
                          key={date}
                          className="h-6 flex-1 rounded-sm border border-[var(--border-base)]"
                          style={{
                            backgroundColor:
                              count > 0 ? cat.color : "var(--bg-elevated)",
                            opacity: count > 0 ? opacity : 1,
                          }}
                          title={`${cat.name} · ${formatDateShort(date)} · ${count} papers`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div
              className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]"
              style={{ paddingLeft: LABEL_COL_WIDTH + 12 }}
            >
              <span>Fewer papers</span>
              {[0.25, 0.5, 0.75, 1].map((o, i) => (
                <div
                  key={i}
                  className="h-[12px] w-[12px] rounded-sm bg-[var(--text-primary)]"
                  style={{ opacity: o }}
                />
              ))}
              <span>More papers (relative to that category's busiest week shown)</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
