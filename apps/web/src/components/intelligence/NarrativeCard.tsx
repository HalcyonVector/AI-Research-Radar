"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ArrowUpRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, prettifySlug } from "@/lib/formatters";
import { getCategory } from "@/lib/constants";
import type { Narrative } from "@/types/intelligence";

// Mirrors NarrativeCard's actual layout (not a generic bar stack) so there's
// no shape/height jump when the real narrative arrives, plus a "generating"
// cue since this is an LLM synthesis step, not a plain data fetch.
export function NarrativeCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="animate-pulse text-[var(--accent-hover)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Synthesizing ecosystem narrative
            <span className="inline-flex w-4 animate-pulse">…</span>
          </span>
        </div>
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>

      <div className="mt-4 border-t border-[var(--border-base)] pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Referenced
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

function entityHref(e: { type: string; id: string }): string {
  if (e.type === "paper") return `/papers/${e.id}`;
  if (e.type === "category") return `/trends/${e.id}`;
  if (e.type === "model") return `/models/${e.id}`;
  return "#";
}

// The AI narrative generator embeds `[[paper:UUID]]` and (occasionally)
// `[[category:slug]]` tokens. Paper tokens resolve via `referenced_entities`
// (the only thing that column can store); category tokens have no backend
// lookup at all, so they're resolved client-side against the category list.
const REF_TOKEN = /\[\[(paper|category):([\w-]+)\]\]/g;

function renderNarrativeText(text: string, refs: Narrative["referenced_entities"]) {
  const byId = new Map(refs.map((e) => [e.id, e]));
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  REF_TOKEN.lastIndex = 0;
  while ((match = REF_TOKEN.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [, type, id] = match;

    if (type === "paper") {
      const ref = byId.get(id);
      if (ref) {
        parts.push(
          <Link
            key={match.index}
            href={entityHref(ref)}
            className="font-medium text-[var(--accent-hover)] hover:underline"
          >
            {ref.title}
          </Link>
        );
      }
      // unresolved paper token: strip silently rather than leak "[[paper:...]]"
    } else {
      const def = getCategory(id);
      parts.push(
        <Link
          key={match.index}
          href={`/trends/${id}`}
          className="font-medium text-[var(--accent-hover)] hover:underline"
        >
          {def.name === id ? prettifySlug(id) : def.name}
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Only used on the Intelligence page, directly above the "Explore the engine"
// grid — shows the full narrative, not a truncated teaser.
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
        {renderNarrativeText(narrative.narrative_text, narrative.referenced_entities ?? [])}
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
