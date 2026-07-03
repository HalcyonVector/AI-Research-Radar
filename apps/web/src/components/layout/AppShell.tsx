"use client";

import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { CommandPalette } from "@/components/search/CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <TopNav />
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1400px] animate-fade-in">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
