"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Radar,
  Boxes,
  Network,
  Brain,
  Newspaper,
  Radio,
  Sparkles,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/papers", label: "Papers", icon: FileText },
  { href: "/trends", label: "Trend Radar", icon: Radar },
  { href: "/models", label: "Models", icon: Boxes },
  { href: "/graph", label: "Knowledge Graph", icon: Network },
  { href: "/briefings", label: "Briefings", icon: Newspaper },
];

const INTEL = [
  { href: "/intelligence", label: "Engine Home", icon: Brain },
  { href: "/intelligence/sleeping-giants", label: "Sleeping Giants", icon: Moon },
  { href: "/intelligence/frontier", label: "Frontier", icon: Radio },
  { href: "/intelligence/collaborations", label: "Collaborations", icon: Sparkles },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Radar; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      )}
    >
      <Icon
        size={17}
        className={cn(active ? "text-[var(--accent-hover)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]")}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border-base)] bg-[var(--bg-surface)] lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border-base)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
          <Radar size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Research Radar</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">AI Intelligence Layer</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="mt-6 mb-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Intelligence Engine
          </p>
        </div>
        <div className="space-y-1">
          {INTEL.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--border-base)] p-3">
        <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
          <p className="text-xs font-medium text-[var(--text-primary)]">Layer 3 Reasoning</p>
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-tertiary)]">
            Why it&apos;s happening, where it&apos;s going, what it means.
          </p>
        </div>
      </div>
    </aside>
  );
}
