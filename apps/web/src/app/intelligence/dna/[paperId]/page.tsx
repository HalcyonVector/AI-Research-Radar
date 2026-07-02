"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/BentoGrid";
import { ResearchDNAChart } from "@/components/intelligence/ResearchDNAChart";
import { DNASimilarityPanel } from "@/components/intelligence/DNASimilarityPanel";
import { InfluenceScoreBreakdown } from "@/components/intelligence/InfluenceScoreBreakdown";

export default function DNAPage() {
  const params = useParams<{ paperId: string }>();
  const paperId = params?.paperId as string;
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Research DNA"
        description="The conceptual composition of a paper and its genetically closest relatives."
      />
      <TwoColumnLayout
        main={
          <>
            <ResearchDNAChart paperId={paperId} />
            <DNASimilarityPanel paperId={paperId} />
          </>
        }
        aside={<InfluenceScoreBreakdown paperId={paperId} />}
      />
    </div>
  );
}
