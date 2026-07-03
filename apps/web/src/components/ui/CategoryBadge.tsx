"use client";

import Link from "next/link";
import { getCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  slug: string;
  name?: string;
  color?: string;
  withIcon?: boolean;
  href?: string;
  className?: string;
}

export function CategoryBadge({ slug, name, href, className }: CategoryBadgeProps) {
  const cat = getCategory(slug);
  const label = name || cat.name;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-[var(--rule-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]",
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: cat.color }} />
      {label}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-colors hover:text-[var(--text-primary)]">
        {content}
      </Link>
    );
  }
  return content;
}
