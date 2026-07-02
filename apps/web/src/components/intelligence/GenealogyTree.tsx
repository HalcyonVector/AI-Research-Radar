"use client";

import { GitBranch, FileText } from "lucide-react";
import Link from "next/link";
import { useGenealogy } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDate } from "@/lib/formatters";
import type { GenealogyNode } from "@/types/intelligence";

function TreeNode({ node, depth }: { node: GenealogyNode; depth: number }) {
  return (
    <li className="relative">
      <div
        className="flex items-center gap-2 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] px-3 py-2"
        style={{ marginLeft: depth * 16 }}
      >
        <FileText size={13} className="shrink-0 text-[var(--accent-hover)]" />
        <Link
          href={`/papers/${node.id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-hover)]"
        >
          {node.label}
        </Link>
        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{formatDate(node.date)}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="mt-2 space-y-2 border-l border-dashed border-[var(--border-base)]">
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function GenealogyTree({ paperId }: { paperId: string }) {
  const { data, isLoading } = useGenealogy(paperId);
  const root = data?.root;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch size={14} className="text-[var(--accent-hover)]" />
          Intellectual Genealogy
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        The ancestral lineage of ideas this paper builds upon.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : !root ? (
        <EmptyState compact title="No genealogy" description="Ancestry hasn't been traced for this paper." />
      ) : (
        <ul className="space-y-2">
          <TreeNode node={root} depth={0} />
        </ul>
      )}
    </Card>
  );
}
