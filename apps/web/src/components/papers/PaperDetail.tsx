"use client";

import Link from "next/link";
import { ExternalLink, Building2, Calendar, FileText, Network } from "lucide-react";
import type { PaperDetail as PaperDetailType } from "@/types/paper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { authorList, formatDate } from "@/lib/formatters";

interface PaperDetailProps {
  paper: PaperDetailType;
}

export function PaperDetail({ paper }: PaperDetailProps) {
  const cat = paper.primary_category;
  const arxivUrl = paper.arxiv_id ? `https://arxiv.org/abs/${paper.arxiv_id}` : null;
  const s = paper.scores;

  return (
    <Card>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: meta */}
        <div className="min-w-0 flex-1">
          <div className="mb-3">
            <CategoryBadge slug={cat?.slug} name={cat?.name} color={cat?.color} />
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] lg:text-3xl">
            {paper.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--text-secondary)]">
            <span className="min-w-0 truncate">{authorList(paper.authors, 4)}</span>
            {paper.org_name && (
              <span className="flex items-center gap-1 text-[var(--text-tertiary)]">
                <Building2 size={13} />
                {paper.org_name}
              </span>
            )}
            <span className="flex items-center gap-1 text-[var(--text-tertiary)]">
              <Calendar size={13} />
              {formatDate(paper.published_at)}
            </span>
            {arxivUrl ? (
              <a
                href={arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[var(--accent-hover)] hover:underline"
              >
                <FileText size={13} />
                {paper.arxiv_id}
                <ExternalLink size={11} />
              </a>
            ) : (
              <span className="flex items-center gap-1 font-mono text-[var(--text-tertiary)]">
                <FileText size={13} />
                {paper.arxiv_id}
              </span>
            )}
          </div>

          {paper.abstract_snippet && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {paper.abstract_snippet}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {arxivUrl && (
              <a href={arxivUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm">
                  <ExternalLink size={14} />
                  View on arXiv
                </Button>
              </a>
            )}
            <Link href="/graph">
              <Button variant="secondary" size="sm">
                <Network size={14} />
                Open in graph
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: scores */}
        <div className="flex shrink-0 flex-col items-center gap-4">
          <ScoreRing score={s?.composite ?? 0} size={72} label="Composite" />
          <div className="flex gap-3">
            <ScoreRing score={s?.impact ?? 0} size={56} label="Impact" />
            <ScoreRing score={s?.momentum ?? 0} size={56} label="Momentum" />
            <ScoreRing score={s?.innovation ?? 0} size={56} label="Innovation" />
          </div>
        </div>
      </div>
    </Card>
  );
}
