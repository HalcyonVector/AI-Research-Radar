"use client";

import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatters";
import type { Narrative } from "@/types/intelligence";

function entityHref(e: { type: string; id: string }): string {
  if (e.type === "paper") return `/papers/${e.id}`;
  if (e.type === "category") return `/trends/${e.id}`;
  if (e.type === "model") return `/models/${e.id}`;
  return "#";
}

export function NarrativeCard({ narrative }: { narrative: Narrative }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-[var(--accent-hover)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {narrative.scope === "global" ? "Ecosystem Narrative" : `Narrative · ${narrative.scope_ref}`}
          </span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {formatDate(narrative.period_start)} – {formatDate(narrative.period_end)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        {narrative.narrative_text}
      </p>

      {narrative.referenced_entities?.length > 0 && (
        <div className="mt-4 border-t border-[var(--border-base)] pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Referenced
          </p>
          <div className="flex flex-wrap gap-1.5">
            {narrative.referenced_entities.map((e, i) => (
              <Link key={i} href={entityHref(e)} className="inline-flex hover:opacity-80">
                <Badge color="#6366f1" className="gap-1">
                  {e.title}
                  <ArrowUpRight size={11} />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
