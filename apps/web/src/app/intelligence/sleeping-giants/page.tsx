"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SleepingGiantsPanel } from "@/components/dashboard/SleepingGiantsPanel";

export default function SleepingGiantsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence Engine"
        title="Sleeping Giants"
        description="Under-cited papers whose adoption signals resemble work that later became foundational."
      />
      <SleepingGiantsPanel />
    </div>
  );
}
