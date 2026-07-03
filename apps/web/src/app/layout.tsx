import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CommandPaletteProvider } from "@/components/providers/CommandPaletteProvider";
import { AppShell } from "@/components/layout/AppShell";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Research Radar",
  description:
    "A continuously updated, AI-assisted intelligence layer over the global AI research ecosystem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${grotesk.variable} ${jetbrains.variable}`}>
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
