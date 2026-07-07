"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { TalentFlowPanel } from "@/components/intelligence/TalentFlowPanel";

export default function TalentFlowPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Talent Flow"
        description="Researchers moving between organizations, detected from per-paper author affiliations over time."
      />
      <TalentFlowPanel limit={50} />
    </div>
  );
}
