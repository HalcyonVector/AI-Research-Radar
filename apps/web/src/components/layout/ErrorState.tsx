"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. The backend may be offline.",
  onRetry,
  compact,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ef444433] bg-[#ef44440a] text-center ${
        compact ? "py-8 px-4" : "py-14 px-6"
      }`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ef44441a]">
        <AlertTriangle size={22} className="text-[#ef4444]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-[var(--text-secondary)]">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={13} />
          Retry
        </Button>
      )}
    </div>
  );
}
