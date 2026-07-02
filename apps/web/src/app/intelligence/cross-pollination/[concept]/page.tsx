"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrossPollinationMap } from "@/components/intelligence/CrossPollinationMap";

export default function CrossPollinationPage() {
  const params = useParams<{ concept: string }>();
  const concept = decodeURIComponent((params?.concept as string) ?? "");
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Cross-Pollination"
        description="How a concept traveled between research domains over time."
      />
      <CrossPollinationMap concept={concept} />
    </div>
  );
}
