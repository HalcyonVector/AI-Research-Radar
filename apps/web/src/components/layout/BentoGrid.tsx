import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

interface BentoCellProps extends HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
}

const colMap: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
};
const rowMap: Record<number, string> = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
  3: "lg:row-span-3",
};

export function BentoCell({ colSpan = 1, rowSpan = 1, className, children, ...props }: BentoCellProps) {
  return (
    <div className={cn(colMap[colSpan], rowMap[rowSpan], "min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

export function TwoColumnLayout({
  main,
  aside,
  className,
}: {
  main: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-3", className)}>
      <div className="lg:col-span-2 min-w-0 space-y-6">{main}</div>
      <div className="space-y-6 min-w-0">{aside}</div>
    </div>
  );
}
