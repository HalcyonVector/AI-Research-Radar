import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CommandPaletteProvider } from "@/components/providers/CommandPaletteProvider";
import { AppShell } from "@/components/layout/AppShell";

// Bundled (OFL, latin subset, variable weight) rather than next/font/google,
// so builds don't fail when the Google Fonts download hiccups.
const grotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.woff2",
  weight: "300 700",
  variable: "--font-grotesk",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Research Radar",
  description:
    "A continuously updated, AI-assisted intelligence layer over the global AI research ecosystem.",
  alternates: {
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "AI Research Radar: Weekly Briefings" }] },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`dark ${grotesk.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <CommandPaletteProvider>
                <AppShell>{children}</AppShell>
              </CommandPaletteProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
