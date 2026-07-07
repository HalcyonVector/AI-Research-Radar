"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LabScorecardPanel } from "@/components/intelligence/LabScorecardPanel";

export default function LabScorecardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Lab Scorecard"
        description="Organizations ranked by research output, paper impact, and recent momentum, derived from per-paper author affiliations."
      />
      <LabScorecardPanel limit={50} />
    </div>
  );
}
