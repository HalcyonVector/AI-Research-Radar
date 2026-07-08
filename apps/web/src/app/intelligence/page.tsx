"use client";

import Link from "next/link";
import { Brain, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/layout/ErrorState";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { NarrativeCard, NarrativeCardSkeleton } from "@/components/intelligence/NarrativeCard";
import {
  useNarratives,
  useSleepingGiants,
  useFrontier,
  usePropagation,
  useDNA,
  useCollaborations,
  useTalentFlow,
  useLabScorecard,
  useGenealogy,
  useCrossPollination,
  useEvolution,
} from "@/hooks/useIntelligence";
import { usePapers } from "@/hooks/usePapers";
import { formatScore } from "@/lib/formatters";
import type { GenealogyNode } from "@/types/intelligence";

function countDescendants(node?: GenealogyNode): number {
  if (!node) return 0;
  return (node.children ?? []).reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

interface ExploreEntry {
  // null while the card's target isn't resolved yet (e.g. still waiting on a
  // seed paper id) — rendered as a non-navigable card instead of being
  // omitted from the grid, so the grid's shape/count is stable from first
  // paint instead of cards popping in and reflowing everything around them.
  href: string | null;
  title: string;
  desc: string;
  isLoading: boolean;
  isError: boolean;
  teaser: string | null;
}

// One consistent, compact card for every feature — no "hero" panels vs.
// "afterthought" links. Equal visual weight means people actually scan the
// whole grid instead of stopping at whatever's above the fold.
function ExploreCard({ entry }: { entry: ExploreEntry }) {
  const body = (
    <Card hover={!!entry.href} className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.title}</p>
        {entry.href && <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />}
      </div>
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{entry.desc}</p>
      <div className="mt-2.5 border-t border-[var(--border-base)] pt-2.5">
        {entry.isLoading || !entry.href ? (
          <Skeleton className="h-3 w-4/5" />
        ) : entry.isError ? (
          <p className="text-xs leading-relaxed text-[#ef4444]">Couldn&apos;t load — try again shortly</p>
        ) : (
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
            {entry.teaser ?? "Not enough data yet"}
          </p>
        )}
      </div>
    </Card>
  );

  return entry.href ? (
    <Link href={entry.href} className="block h-full">
      {body}
    </Link>
  ) : (
    <div className="h-full cursor-default opacity-70">{body}</div>
  );
}

export default function IntelligencePage() {
  const { data: narrativeData, isLoading: narrativeLoading, isError: narrativeError } = useNarratives({ scope: "global", limit: 1 });
  const narrative = narrativeData?.data?.[0];

  // Paper-scoped features (Propagation/Genealogy/DNA) need a real paper ID —
  // seed them with today's #1 trending paper instead of a hardcoded placeholder.
  const { data: papersData } = usePapers({ limit: 1 });
  const topPaper = papersData?.pages[0]?.data[0];
  const seedPaperId = topPaper?.id ?? "";

  const { data: giantsData, isLoading: giantsLoading, isError: giantsError } = useSleepingGiants({ limit: 1 });
  const topGiant = giantsData?.data?.[0];

  const { data: frontierData, isLoading: frontierLoading, isError: frontierError } = useFrontier();
  const topPred = (frontierData?.data ?? [])[0];

  const { data: propData, isLoading: propLoading, isError: propError } = usePropagation(seedPaperId);
  const propChain = propData?.chain ?? [];

  const { data: dnaData, isLoading: dnaLoading, isError: dnaError } = useDNA(seedPaperId);
  const dnaComposition = dnaData?.composition ?? [];

  const { data: genData, isLoading: genLoading, isError: genError } = useGenealogy(seedPaperId, 3);
  const ancestorCount = countDescendants(genData?.root);

  const { data: collabData, isLoading: collabLoading, isError: collabError } = useCollaborations();
  const topCluster = collabData?.data?.[0];

  const { data: talentData, isLoading: talentLoading, isError: talentError } = useTalentFlow({ limit: 1 });
  const topMove = talentData?.data?.[0];

  const { data: labData, isLoading: labLoading, isError: labError } = useLabScorecard({ limit: 1 });
  const topLab = labData?.data?.[0];

  const { data: cpData, isLoading: cpLoading, isError: cpError } = useCrossPollination("attention");
  const cpChain = cpData?.chain ?? [];

  const { data: evoData, isLoading: evoLoading, isError: evoError } = useEvolution("chain-of-thought");
  const evoStages = evoData?.stages ?? [];

  const entries: ExploreEntry[] = [
    {
      href: "/intelligence/sleeping-giants",
      title: "Sleeping Giants",
      desc: "Under-cited papers about to break out",
      isLoading: giantsLoading,
      isError: giantsError,
      teaser: topGiant
        ? `Top pick: "${topGiant.paper.title}" — breakout score ${formatScore(topGiant.emerging_breakthrough_score)}`
        : null,
    },
    {
      href: "/intelligence/frontier",
      title: "Frontier Predictor",
      desc: "Where the next explosion is likely",
      isLoading: frontierLoading,
      isError: frontierError,
      teaser: topPred
        ? `${topPred.category.name}: ${Math.round(topPred.explosion_probability * 100)}% chance in ~${topPred.horizon_weeks}w`
        : null,
    },
    {
      href: seedPaperId ? `/intelligence/propagation/${seedPaperId}` : null,
      title: "Idea Propagation",
      desc: "How an idea spread across the ecosystem",
      isLoading: !seedPaperId || propLoading,
      isError: propError,
      teaser: propChain.length
        ? `${propChain.length}-step trail traced from "${topPaper?.title}"`
        : null,
    },
    {
      href: seedPaperId ? `/intelligence/dna/${seedPaperId}` : null,
      title: "Research DNA",
      desc: "The conceptual makeup of a paper",
      isLoading: !seedPaperId || dnaLoading,
      isError: dnaError,
      teaser: dnaComposition.length ? `Dominant concept: ${dnaComposition[0].concept}` : null,
    },
    {
      href: seedPaperId ? `/intelligence/genealogy/${seedPaperId}` : null,
      title: "Genealogy",
      desc: "The lineage of an idea",
      isLoading: !seedPaperId || genLoading,
      isError: genError,
      teaser:
        ancestorCount > 0
          ? `Traces back through ${ancestorCount} related paper${ancestorCount === 1 ? "" : "s"}`
          : null,
    },
    {
      href: "/intelligence/collaborations",
      title: "Collaboration Clusters",
      desc: "Which orgs are converging",
      isLoading: collabLoading,
      isError: collabError,
      teaser: topCluster
        ? `${topCluster.member_orgs
            .slice(0, 2)
            .map((o) => o.name)
            .join(" + ")}${
            topCluster.member_orgs.length > 2 ? ` +${topCluster.member_orgs.length - 2}` : ""
          } converging on "${topCluster.formed_around_concept}"`
        : null,
    },
    {
      href: "/intelligence/talent-flow",
      title: "Talent Flow",
      desc: "Researchers moving between organizations",
      isLoading: talentLoading,
      isError: talentError,
      teaser: topMove
        ? `${topMove.author_name ?? "A researcher"}${
            topMove.from_org ? ` left ${topMove.from_org.name}` : ""
          }${topMove.to_org ? ` for ${topMove.to_org.name}` : ""}`
        : null,
    },
    {
      href: "/intelligence/lab-scorecard",
      title: "Lab Scorecard",
      desc: "Labs ranked by output, impact, and momentum",
      isLoading: labLoading,
      isError: labError,
      teaser: topLab
        ? `#1 ${topLab.org.name} — composite ${formatScore(topLab.composite_score)}, ${topLab.papers_30d} papers/30d`
        : null,
    },
    {
      href: "/intelligence/cross-pollination/attention",
      title: "Cross-Pollination",
      desc: "How concepts jump between fields",
      isLoading: cpLoading,
      isError: cpError,
      teaser: cpChain.length
        ? `"Attention" crossed ${cpChain.length} field${cpChain.length === 1 ? "" : "s"}: ${cpChain
            .slice(0, 3)
            .map((s) => s.category)
            .join(" → ")}`
        : null,
    },
    {
      href: "/intelligence/evolution/chain-of-thought",
      title: "Concept Evolution",
      desc: "From idea to product",
      isLoading: evoLoading,
      isError: evoError,
      teaser: evoStages.length
        ? `${evoStages.length} stage${evoStages.length === 1 ? "" : "s"} tracked — latest: ${
            evoStages[evoStages.length - 1].label
          }`
        : null,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Layer 3 Reasoning"
        title="Intelligence Engine"
        description="Why it's happening, where it's going, and what it means. The reasoning layer over the raw research signal."
      />

      {narrativeLoading ? (
        <div className="mb-5">
          <NarrativeCardSkeleton />
        </div>
      ) : narrativeError ? (
        <div className="mb-5">
          <ErrorState compact title="Couldn't load the ecosystem narrative" />
        </div>
      ) : narrative ? (
        <div className="mb-5">
          <NarrativeCard narrative={narrative} />
        </div>
      ) : null}

      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Brain size={15} className="text-[var(--accent-hover)]" />
        Explore the engine
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {entries.map((e) => (
          <ExploreCard key={e.title} entry={e} />
        ))}
      </div>
    </div>
  );
}
