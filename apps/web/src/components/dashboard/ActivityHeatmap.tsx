"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { CATEGORIES, getCategory } from "@/lib/constants";
import { formatDateShort, prettifySlug } from "@/lib/formatters";

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

export function ActivityHeatmap({ data, loading }: ActivityHeatmapProps) {
  const cells = data ?? [];

  // Distinct dates, sorted ascending, take last MAX_DATES.
  const allDates = Array.from(new Set(cells.map((c) => c.date))).sort();
  const dates = allDates.slice(-MAX_DATES);

  // Lookup map: `${slug}|${date}` -> count, plus a per-row (per-category) max so
  // one outlier week/category doesn't wash out every other row's intensity.
  const lookup = new Map<string, number>();
  const rowMax = new Map<string, number>();
  for (const c of cells) {
    const key = `${c.category_slug}|${c.date}`;
    lookup.set(key, c.count);
    const prevMax = rowMax.get(c.category_slug) ?? 0;
    if (c.count > prevMax) rowMax.set(c.category_slug, c.count);
  }

  // Build rows from the slugs actually present in the data (backend slugs like
  // "reasoning-models"), so lookups match. Fall back to the constant list if empty.
  const dataSlugs = Array.from(new Set(cells.map((c) => c.category_slug)));
  const rowSlugs = (dataSlugs.length ? dataSlugs : CATEGORIES.map((c) => c.slug)).slice(0, MAX_ROWS);
  const categories = rowSlugs.map((slug) => {
    const def = getCategory(slug);
    return { slug, name: def.name === slug ? prettifySlug(slug) : def.name, color: def.color };
  });

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="Activity Heatmap" />

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
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {categories.map((cat) => {
              const max = rowMax.get(cat.slug) ?? 0;
              return (
                <div key={cat.slug} className="flex items-center gap-3 py-[3px]">
                  <span className="w-32 shrink-0 truncate text-[11px] text-[var(--text-tertiary)]">
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
                          title={`${cat.name} · ${formatDateShort(date)} · ${count}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="mt-3 flex items-center gap-2 pl-[140px] text-[10px] text-[var(--text-tertiary)]">
              <span>Less</span>
              {[0.25, 0.5, 0.75, 1].map((o, i) => (
                <div
                  key={i}
                  className="h-[12px] w-[12px] rounded-sm"
                  style={{ backgroundColor: getCategory("llms").color, opacity: o }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
