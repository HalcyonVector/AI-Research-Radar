"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  readLocalBookmarks,
  toggleLocalBookmark,
  useBookmarks,
  useCreateBookmark,
  useDeleteBookmark,
} from "@/hooks/useBookmarks";

interface BookmarkButtonProps {
  entityId: string;
  entityType?: string;
  className?: string;
  /** compact = square icon-ish button; label = includes text */
  variant?: "compact" | "label";
  /** stop the click from bubbling to a parent Link */
  stopPropagation?: boolean;
}

export function BookmarkButton({
  entityId,
  entityType = "paper",
  className,
  variant = "label",
  stopPropagation = false,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const { data } = useBookmarks();
  const create = useCreateBookmark();
  const remove = useDeleteBookmark();

  // Hydrate from localStorage first (offline / demo), then reconcile with server list.
  useEffect(() => {
    setSaved(readLocalBookmarks().includes(entityId));
  }, [entityId]);

  const serverBookmark = data?.data.find((b) => b.entity_id === entityId);
  useEffect(() => {
    if (serverBookmark) setSaved(true);
  }, [serverBookmark]);

  const onClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next = !saved;
    setSaved(next); // optimistic
    toggleLocalBookmark(entityId, next);

    if (next) {
      create.mutate({ entity_type: entityType, entity_id: entityId });
    } else if (serverBookmark) {
      remove.mutate(serverBookmark.id);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      title={saved ? "Remove bookmark" : "Bookmark"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
        saved
          ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)]"
          : "border-[var(--rule-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      <span aria-hidden className="font-mono leading-none">
        {saved ? "■" : "□"}
      </span>
      {variant === "label" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
