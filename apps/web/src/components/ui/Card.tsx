import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  as?: "div" | "article" | "section";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, hover = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative border border-[var(--rule)] bg-[var(--bg-surface)] p-5 transition-colors duration-150",
        hover && "hover:border-[var(--text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  );
}
