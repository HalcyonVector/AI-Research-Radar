"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ArrowUpRight, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, prettifySlug } from "@/lib/formatters";
import { getCategory } from "@/lib/constants";
import type { Narrative } from "@/types/intelligence";

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

export function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const [expanded, setExpanded] = useState(false);
  // AI-generated narratives can run long — collapse by default so this card
  // doesn't dominate the page, especially above a grid of other features.
  const collapsible = narrative.narrative_text.length > 320;

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

      <p
        className={
          "text-sm leading-relaxed text-[var(--text-secondary)]" +
          (collapsible && !expanded ? " line-clamp-3" : "")
        }
      >
        {renderNarrativeText(narrative.narrative_text, narrative.referenced_entities ?? [])}
      </p>

      {collapsible && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--accent-hover)] hover:opacity-80"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown size={13} className={expanded ? "rotate-180" : ""} />
        </button>
      )}

      {expanded && narrative.referenced_entities?.length > 0 && (
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
