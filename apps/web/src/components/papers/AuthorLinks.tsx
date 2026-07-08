"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import type { AuthorRef } from "@/types/paper";

interface AuthorLinksProps {
  authors: AuthorRef[] | undefined;
  max?: number;
  className?: string;
  /**
   * Set when nested inside another wrapping Link (e.g. PaperCard, which wraps
   * the whole card in an <a>). A real nested <a> is invalid HTML and throws a
   * hydration warning, so in that mode each author renders as a span with
   * programmatic navigation instead of an anchor. Standalone usage (e.g.
   * PaperDetail) keeps real links for proper semantics/open-in-new-tab.
   */
  stopPropagation?: boolean;
}

/**
 * Renders a comma-separated author list. Authors with an `id` become links to
 * their author page; the rest render as plain text. Overflow collapses to "+N".
 */
export function AuthorLinks({ authors, max = 3, className, stopPropagation }: AuthorLinksProps) {
  const router = useRouter();

  if (!authors || authors.length === 0) {
    return <span className={className}>Unknown authors</span>;
  }

  const shown = authors.slice(0, max);
  const overflow = authors.length - shown.length;
  const linkCls =
    "underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--text-primary)] hover:decoration-[var(--rule-strong)]";

  return (
    <span className={className}>
      {shown.map((a, i) => (
        <Fragment key={a.id ?? `${a.name}-${i}`}>
          {i > 0 && ", "}
          {a.id ? (
            stopPropagation ? (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/authors/${a.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/authors/${a.id}`);
                }}
                className={`cursor-pointer ${linkCls}`}
              >
                {a.name}
              </span>
            ) : (
              <Link href={`/authors/${a.id}`} className={linkCls}>
                {a.name}
              </Link>
            )
          ) : (
            <span>{a.name}</span>
          )}
        </Fragment>
      ))}
      {overflow > 0 && ` +${overflow}`}
    </span>
  );
}
