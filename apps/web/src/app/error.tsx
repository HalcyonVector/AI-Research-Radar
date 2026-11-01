"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/layout/ErrorState";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-16">
      <ErrorState
        title="This page hit an error"
        message="Something broke while rendering it. Retrying usually helps; if not, head back to the dashboard."
        onRetry={reset}
      />
    </div>
  );
}
