"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCommandPalette } from "@/components/providers/CommandPaletteProvider";
import { useDemoStore } from "@/stores/demo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/papers", label: "Papers" },
  { href: "/trends", label: "Trends" },
  { href: "/models", label: "Models" },
  { href: "/graph", label: "Graph" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/briefings", label: "Briefings" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/developers", label: "Developers" },
];

export function TopNav() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();
  const demo = useDemoStore((s) => s.demo);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b-2 border-[var(--text-primary)] bg-[var(--bg-base)]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-x-6 gap-y-2 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]"
        >
          AI Research Radar
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-x-3 text-[13px] text-[var(--text-secondary)]">
          {NAV.map((item, i) => (
            <span key={item.href} className="flex items-center gap-x-3">
              {i > 0 && <span className="text-[var(--text-tertiary)]">/</span>}
              <Link
                href={item.href}
                className={cn(
                  "transition-colors hover:text-[var(--text-primary)]",
                  isActive(item.href)
                    ? "font-medium text-[var(--text-primary)] underline decoration-2 underline-offset-[6px]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {item.label}
              </Link>
            </span>
          ))}
        </nav>

        {demo ? (
          <span
            title="Backend unreachable — showing sample data."
            className="hidden shrink-0 border border-[var(--rule-strong)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] sm:inline-block"
          >
            Demo data
          </span>
        ) : (
          <span className="hidden shrink-0 items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]" />
            Live
          </span>
        )}

        <button
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-2 border border-[var(--rule-strong)] px-3 py-1.5 text-[11px] uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          Search
          <kbd className="font-mono text-[10px] text-[var(--text-tertiary)]">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
