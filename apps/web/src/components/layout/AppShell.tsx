"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TopNav } from "./TopNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { CompareBar } from "@/components/papers/CompareBar";
import { ServerWakeNotice } from "./ServerWakeNotice";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <TopNav />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1400px] animate-fade-in">{children}</div>
      </main>
      <footer className="border-t border-[var(--rule)] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          <span>AI Research Radar</span>
          <Link href="/developers" className="hover:text-[var(--text-primary)]">
            Developers / API
          </Link>
          <a href="/rss.xml" className="hover:text-[var(--text-primary)]">
            RSS
          </a>
          <a
            href="https://github.com/HalcyonVector/AI-Research-Radar"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)]"
          >
            Source
          </a>
        </div>
      </footer>
      <CommandPalette />
      <CompareBar />
      <ServerWakeNotice />
    </div>
  );
}
