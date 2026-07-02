"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { GenealogyTree } from "@/components/intelligence/GenealogyTree";

export default function GenealogyPage() {
  const params = useParams<{ paperId: string }>();
  const paperId = params?.paperId as string;
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Intellectual Genealogy"
        description="The ancestral lineage of ideas a paper builds upon."
      />
      <GenealogyTree paperId={paperId} />
    </div>
  );
}
