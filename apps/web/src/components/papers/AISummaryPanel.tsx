"use client";

import { Sparkles, Check, AlertTriangle, Zap } from "lucide-react";
import type { AISummary } from "@/types/paper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface AISummaryPanelProps {
  summary: AISummary | null | undefined;
  loading?: boolean;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}

export function AISummaryPanel({ summary, loading }: AISummaryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--accent-hover)]" />
          AI Summary
        </CardTitle>
      </CardHeader>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : !summary ? (
        <EmptyState
          icon={Sparkles}
          compact
          title="AI summary not available yet"
          description="This paper hasn't been processed by the summarization pipeline."
        />
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="limitations">Limitations</TabsTrigger>
            <TabsTrigger value="significance">Significance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {summary.core_contribution && (
              <Section label="Core Contribution" text={summary.core_contribution} />
            )}
            {summary.key_innovation && (
              <Section label="Key Innovation" text={summary.key_innovation} />
            )}
            {summary.problem_solved && (
              <Section label="Problem Solved" text={summary.problem_solved} />
            )}
          </TabsContent>

          <TabsContent value="applications">
            <Label>Practical Applications</Label>
            {summary.practical_applications?.length ? (
              <ul className="space-y-2">
                {summary.practical_applications.map((app, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-[#22c55e]"
                    />
                    <span className="leading-relaxed">{app}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No applications listed.</p>
            )}
          </TabsContent>

          <TabsContent value="limitations">
            <Label>Limitations</Label>
            {summary.limitations?.length ? (
              <ul className="space-y-2">
                {summary.limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <AlertTriangle
                      size={15}
                      className="mt-0.5 shrink-0 text-[#f59e0b]"
                    />
                    <span className="leading-relaxed">{lim}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No limitations listed.</p>
            )}
          </TabsContent>

          <TabsContent value="significance" className="space-y-4">
            {summary.significance && (
              <div className="rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-subtle)]/30 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Zap size={13} className="text-[var(--accent-hover)]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-hover)]">
                    Significance
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                  {summary.significance}
                </p>
              </div>
            )}
            {summary.significance_rationale && (
              <Section label="Rationale" text={summary.significance_rationale} />
            )}
            {summary.related_concepts?.length > 0 && (
              <div>
                <Label>Related Concepts</Label>
                <div className="flex flex-wrap gap-1.5">
                  {summary.related_concepts.map((c, i) => (
                    <Badge key={i} color="#6366f1">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
