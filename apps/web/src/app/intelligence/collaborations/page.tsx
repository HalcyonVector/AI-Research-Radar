"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { CollaborationClusterGraph } from "@/components/intelligence/CollaborationClusterGraph";

export default function CollaborationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Collaboration Clusters"
        description="Organizations that are converging around shared research concepts."
      />
      <CollaborationClusterGraph />
    </div>
  );
}
