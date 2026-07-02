"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Dark-first theme provider. The app is dark-only for now; this simply ensures
 * the `dark` class is applied to the document element.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}
