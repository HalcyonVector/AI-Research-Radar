"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useCommandPalette } from "@/components/providers/CommandPaletteProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/papers", label: "Papers" },
  { href: "/trends", label: "Trends" },
  { href: "/models", label: "Models" },
  { href: "/graph", label: "Graph" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/briefings", label: "Briefings" },
  { href: "/compare", label: "Compare" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/developers", label: "Developers" },
];

export function TopNav() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  const iconButton =
    "flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--rule-strong)] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]";

  return (
    <header className="sticky top-0 z-30 border-b-2 border-[var(--text-primary)] bg-[var(--bg-base)]">
      <div className="px-4 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center gap-x-6 py-3.5">
          <Link
            href="/"
            className="shrink-0 text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]"
          >
            AI Research Radar
          </Link>

          <nav className="hidden flex-1 flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[var(--text-secondary)] lg:flex">
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

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <span className="hidden items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]" />
              Live
            </span>

            <button
              onClick={() => setOpen(true)}
              className="flex h-8 items-center gap-2 border border-[var(--rule-strong)] px-3 text-[11px] uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
            >
              Search
              <kbd className="hidden font-mono text-[10px] text-[var(--text-tertiary)] [@media(hover:hover)]:inline">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggle}
              className={iconButton}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(iconButton, "lg:hidden")}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mx-auto max-w-[1400px] border-t border-[var(--rule)] pb-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block border-b border-[var(--rule)] py-3 text-sm",
                  isActive(item.href)
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
