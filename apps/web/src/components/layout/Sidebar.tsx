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
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-[rgba(99,102,241,0.22)] to-[rgba(34,211,238,0.06)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(129,140,248,0.25)]"
          : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-[var(--accent-hover)] to-[var(--accent-2)] shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      )}
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
    <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-[var(--glass-border)] bg-[rgba(12,12,20,0.5)] backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--glass-border)] px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-[0_0_18px_-2px_rgba(99,102,241,0.7)]">
          <Radar size={18} className="text-white" />
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-gradient">Research Radar</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">AI Intelligence Layer</p>
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

      <div className="border-t border-[var(--glass-border)] p-3">
        <div className="relative overflow-hidden rounded-xl border border-[rgba(129,140,248,0.2)] bg-gradient-to-br from-[rgba(99,102,241,0.14)] to-[rgba(34,211,238,0.05)] p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--accent-hover)]" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">Layer 3 Reasoning</p>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">
            Why it&apos;s happening, where it&apos;s going, what it means.
          </p>
        </div>
      </div>
    </aside>
  );
}
