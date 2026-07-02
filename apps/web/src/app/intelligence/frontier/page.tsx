"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { FrontierPredictorPanel } from "@/components/intelligence/FrontierPredictorPanel";

export default function FrontierPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Frontier Predictor"
        description="Categories most likely to see a research explosion, ranked by current signal momentum."
      />
      <FrontierPredictorPanel />
    </div>
  );
}
