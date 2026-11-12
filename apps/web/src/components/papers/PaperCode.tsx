"use client";

import { ExternalLink, Star } from "lucide-react";
import type { Implementation } from "@/types/paper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCompact } from "@/lib/formatters";

/** GitHub repos whose README cites this paper. Renders nothing when there are
 * none, which is most papers, rather than an empty card. */
export function PaperCode({ repos }: { repos?: Implementation[] }) {
  if (!repos?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code</CardTitle>
      </CardHeader>
      <ul className="divide-y divide-[var(--rule)]">
        {repos.map((r) => (
          <li key={r.full_name} className="py-2.5 first:pt-0 last:pb-0">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-mono text-[13px] text-[var(--text-primary)] group-hover:underline">
                  <span className="truncate">{r.full_name}</span>
                  <ExternalLink size={11} className="shrink-0 text-[var(--text-tertiary)]" />
                </span>
                {r.description && (
                  <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--text-secondary)]">
                    {r.description}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-[var(--text-tertiary)]">
                <Star size={11} />
                {formatCompact(r.stars)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
