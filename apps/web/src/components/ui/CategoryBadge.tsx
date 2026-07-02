"use client";

import Link from "next/link";
import { getCategory } from "@/lib/constants";
import { Badge } from "./Badge";

interface CategoryBadgeProps {
  slug: string;
  name?: string;
  color?: string;
  withIcon?: boolean;
  href?: string;
  className?: string;
}

export function CategoryBadge({ slug, name, color, withIcon = true, href, className }: CategoryBadgeProps) {
  const cat = getCategory(slug);
  const Icon = cat.icon;
  const label = name || cat.name;
  const c = color || cat.color;

  const content = (
    <Badge color={c} className={className}>
      {withIcon && <Icon size={11} />}
      {label}
    </Badge>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}
