"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PropagationChain } from "@/components/intelligence/PropagationChain";

export default function PropagationPage() {
  const params = useParams<{ seedId: string }>();
  const seedId = params?.seedId as string;
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Idea Propagation"
        description="Trace how a single idea spread from its origin across repos, models, and products."
      />
      <PropagationChain seedId={seedId} />
    </div>
  );
}
