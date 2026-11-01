import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";

export default function NotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="This page doesn't exist, or the paper, model or briefing it pointed to has been removed."
        action={
          <Link
            href="/"
            className="border border-[var(--rule-strong)] px-3 py-1.5 text-[11px] uppercase tracking-widest text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          >
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
