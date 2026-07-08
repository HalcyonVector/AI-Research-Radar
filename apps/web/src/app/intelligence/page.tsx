"use client";

import Link from "next/link";
import { Brain, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { NarrativeCard } from "@/components/intelligence/NarrativeCard";
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
  href: string;
  title: string;
  desc: string;
  isLoading: boolean;
  teaser: string | null;
}

// One consistent, compact card for every feature — no "hero" panels vs.
// "afterthought" links. Equal visual weight means people actually scan the
// whole grid instead of stopping at whatever's above the fold.
function ExploreCard({ entry }: { entry: ExploreEntry }) {
  return (
    <Link href={entry.href} className="block h-full">
      <Card hover className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.title}</p>
          <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{entry.desc}</p>
        <div className="mt-2.5 border-t border-[var(--border-base)] pt-2.5">
          {entry.isLoading ? (
            <Skeleton className="h-3 w-4/5" />
          ) : (
            <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
              {entry.teaser ?? "Not enough data yet"}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function IntelligencePage() {
  const { data: narrativeData, isLoading: narrativeLoading } = useNarratives({ scope: "global", limit: 1 });
  const narrative = narrativeData?.data?.[0];

  // Paper-scoped features (Propagation/Genealogy/DNA) need a real paper ID —
  // seed them with today's #1 trending paper instead of a hardcoded placeholder.
  const { data: papersData } = usePapers({ limit: 1 });
  const topPaper = papersData?.pages[0]?.data[0];
  const seedPaperId = topPaper?.id ?? "";

  const { data: giantsData, isLoading: giantsLoading } = useSleepingGiants({ limit: 1 });
  const topGiant = giantsData?.data?.[0];

  const { data: frontierData, isLoading: frontierLoading } = useFrontier();
  const topPred = (frontierData?.data ?? [])[0];

  const { data: propData, isLoading: propLoading } = usePropagation(seedPaperId);
  const propChain = propData?.chain ?? [];

  const { data: dnaData, isLoading: dnaLoading } = useDNA(seedPaperId);
  const dnaComposition = dnaData?.composition ?? [];

  const { data: genData, isLoading: genLoading } = useGenealogy(seedPaperId, 3);
  const ancestorCount = countDescendants(genData?.root);

  const { data: collabData, isLoading: collabLoading } = useCollaborations();
  const topCluster = collabData?.data?.[0];

  const { data: talentData, isLoading: talentLoading } = useTalentFlow({ limit: 1 });
  const topMove = talentData?.data?.[0];

  const { data: labData, isLoading: labLoading } = useLabScorecard({ limit: 1 });
  const topLab = labData?.data?.[0];

  const { data: cpData, isLoading: cpLoading } = useCrossPollination("attention");
  const cpChain = cpData?.chain ?? [];

  const { data: evoData, isLoading: evoLoading } = useEvolution("chain-of-thought");
  const evoStages = evoData?.stages ?? [];

  const entries: ExploreEntry[] = [
    {
      href: "/intelligence/sleeping-giants",
      title: "Sleeping Giants",
      desc: "Under-cited papers about to break out",
      isLoading: giantsLoading,
      teaser: topGiant
        ? `Top pick: "${topGiant.paper.title}" — breakout score ${formatScore(topGiant.emerging_breakthrough_score)}`
        : null,
    },
    {
      href: "/intelligence/frontier",
      title: "Frontier Predictor",
      desc: "Where the next explosion is likely",
      isLoading: frontierLoading,
      teaser: topPred
        ? `${topPred.category.name}: ${Math.round(topPred.explosion_probability * 100)}% chance in ~${topPred.horizon_weeks}w`
        : null,
    },
    ...(seedPaperId
      ? [
          {
            href: `/intelligence/propagation/${seedPaperId}`,
            title: "Idea Propagation",
            desc: "How an idea spread across the ecosystem",
            isLoading: propLoading,
            teaser: propChain.length
              ? `${propChain.length}-step trail traced from "${topPaper?.title}"`
              : null,
          },
          {
            href: `/intelligence/dna/${seedPaperId}`,
            title: "Research DNA",
            desc: "The conceptual makeup of a paper",
            isLoading: dnaLoading,
            teaser: dnaComposition.length ? `Dominant concept: ${dnaComposition[0].concept}` : null,
          },
          {
            href: `/intelligence/genealogy/${seedPaperId}`,
            title: "Genealogy",
            desc: "The lineage of an idea",
            isLoading: genLoading,
            teaser:
              ancestorCount > 0
                ? `Traces back through ${ancestorCount} related paper${ancestorCount === 1 ? "" : "s"}`
                : null,
          },
        ]
      : []),
    {
      href: "/intelligence/collaborations",
      title: "Collaboration Clusters",
      desc: "Which orgs are converging",
      isLoading: collabLoading,
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
      teaser: topLab
        ? `#1 ${topLab.org.name} — composite ${formatScore(topLab.composite_score)}, ${topLab.papers_30d} papers/30d`
        : null,
    },
    {
      href: "/intelligence/cross-pollination/attention",
      title: "Cross-Pollination",
      desc: "How concepts jump between fields",
      isLoading: cpLoading,
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
          <Card className="flex flex-col">
            <Skeleton className="mb-3 h-4 w-1/3" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </Card>
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
          <ExploreCard key={e.href} entry={e} />
        ))}
      </div>
    </div>
  );
}
