"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EvolutionTimeline } from "@/components/intelligence/EvolutionTimeline";

export default function EvolutionPage() {
  const params = useParams<{ concept: string }>();
  const concept = decodeURIComponent((params?.concept as string) ?? "");
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Concept Evolution"
        description="The lifecycle of a concept, from first appearance to productization."
      />
      <EvolutionTimeline concept={concept} />
    </div>
  );
}
