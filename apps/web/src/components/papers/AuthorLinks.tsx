"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { AuthorRef } from "@/types/paper";

interface AuthorLinksProps {
  authors: AuthorRef[] | undefined;
  max?: number;
  className?: string;
  /** stop clicks bubbling to a wrapping Link (e.g. inside PaperCard) */
  stopPropagation?: boolean;
}

/**
 * Renders a comma-separated author list. Authors with an `id` become links to
 * their author page; the rest render as plain text. Overflow collapses to "+N".
 */
export function AuthorLinks({ authors, max = 3, className, stopPropagation }: AuthorLinksProps) {
  if (!authors || authors.length === 0) {
    return <span className={className}>Unknown authors</span>;
  }

  const shown = authors.slice(0, max);
  const overflow = authors.length - shown.length;

  const guard = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return (
    <span className={className}>
      {shown.map((a, i) => (
        <Fragment key={a.id ?? `${a.name}-${i}`}>
          {i > 0 && ", "}
          {a.id ? (
            <Link
              href={`/authors/${a.id}`}
              onClick={guard}
              className="underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--text-primary)] hover:decoration-[var(--rule-strong)]"
            >
              {a.name}
            </Link>
          ) : (
            <span>{a.name}</span>
          )}
        </Fragment>
      ))}
      {overflow > 0 && ` +${overflow}`}
    </span>
  );
}
