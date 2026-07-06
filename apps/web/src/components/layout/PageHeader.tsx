import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-bold uppercase leading-[0.98] tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between border-b-2 border-[var(--text-primary)] pb-2">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="-ml-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
