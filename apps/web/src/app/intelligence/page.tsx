"use client";

import Link from "next/link";
import { Brain, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BentoGrid, BentoCell } from "@/components/layout/BentoGrid";
import { Card } from "@/components/ui/Card";
import { SleepingGiantsPanel } from "@/components/dashboard/SleepingGiantsPanel";
import { FrontierPredictorPanel } from "@/components/intelligence/FrontierPredictorPanel";
import { PropagationChain } from "@/components/intelligence/PropagationChain";
import { ResearchDNAChart } from "@/components/intelligence/ResearchDNAChart";
import { NarrativeCard } from "@/components/intelligence/NarrativeCard";
import { useNarratives } from "@/hooks/useIntelligence";

const ENTRIES = [
  { href: "/intelligence/sleeping-giants", title: "Sleeping Giants", desc: "Under-cited papers about to break out" },
  { href: "/intelligence/frontier", title: "Frontier Predictor", desc: "Where the next explosion is likely" },
  { href: "/intelligence/collaborations", title: "Collaboration Clusters", desc: "Which orgs are converging" },
  { href: "/intelligence/propagation/paper-1", title: "Idea Propagation", desc: "How an idea spread across the ecosystem" },
  { href: "/intelligence/genealogy/paper-1", title: "Genealogy", desc: "The lineage of an idea" },
  { href: "/intelligence/dna/paper-1", title: "Research DNA", desc: "The conceptual makeup of a paper" },
  { href: "/intelligence/cross-pollination/attention", title: "Cross-Pollination", desc: "How concepts jump between fields" },
  { href: "/intelligence/evolution/chain-of-thought", title: "Concept Evolution", desc: "From idea to product" },
];

export default function IntelligencePage() {
  const { data } = useNarratives({ scope: "global", limit: 1 });
  const narrative = data?.data?.[0];

  return (
    <div>
      <PageHeader
        eyebrow="Layer 3 Reasoning"
        title="Intelligence Engine"
        description="Why it's happening, where it's going, and what it means. The reasoning layer over the raw research signal."
      />

      {narrative && (
        <div className="mb-6">
          <NarrativeCard narrative={narrative} />
        </div>
      )}

      <BentoGrid>
        <BentoCell colSpan={2} rowSpan={2}>
          <SleepingGiantsPanel teaser limit={3} />
        </BentoCell>
        <BentoCell colSpan={2} rowSpan={2}>
          <FrontierPredictorPanel limit={5} />
        </BentoCell>
        <BentoCell colSpan={2}>
          <PropagationChain seedId="paper-1" />
        </BentoCell>
        <BentoCell colSpan={2}>
          <ResearchDNAChart paperId="paper-1" />
        </BentoCell>
      </BentoGrid>

      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Brain size={15} className="text-[var(--accent-hover)]" />
          Explore the engine
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((e) => (
            <Link key={e.href} href={e.href}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{e.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{e.desc}</p>
                  </div>
                  <ArrowUpRight size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
