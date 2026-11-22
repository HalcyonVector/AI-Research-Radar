import Link from "next/link";
import type { ReactNode } from "react";

const REPO = "https://github.com/HalcyonVector/AI-Research-Radar";

const SOURCES = [
  { name: "arXiv", href: "https://info.arxiv.org/help/api/index.html", what: "papers" },
  { name: "Hugging Face", href: "https://huggingface.co/docs/hub/api", what: "models" },
  { name: "GitHub", href: "https://docs.github.com/en/rest", what: "repositories" },
  { name: "Semantic Scholar", href: "https://www.semanticscholar.org/product/api", what: "citations" },
  { name: "OpenAlex", href: "https://docs.openalex.org", what: "authors and institutions" },
  { name: "Hacker News", href: "https://github.com/HackerNews/API", what: "discussion" },
  { name: "Reddit", href: "https://www.reddit.com/dev/api", what: "discussion" },
];

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-[var(--rule-strong)] underline-offset-2 hover:text-[var(--text-primary)]"
    >
      {children}
    </a>
  );
}

/** Compact two-line footer: what this is, where the data comes from, who built it. */
export function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] px-5 py-4 sm:px-8">
      <div className="mx-auto max-w-[1400px] space-y-1.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
        <p className="break-words">
          Tracks new AI papers, models and code and how they connect. Scores and summaries are
          heuristics and LLM output, not peer review. Data:{" "}
          {SOURCES.map((s, i) => (
            <span key={s.name}>
              <Ext href={s.href}>{s.name}</Ext> ({s.what}){i < SOURCES.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            Built by <strong className="font-semibold text-[var(--text-secondary)]">Sagnik</strong>
          </span>
          <Ext href="https://github.com/HalcyonVector">GitHub @HalcyonVector</Ext>
          <Ext href={REPO}>Source</Ext>
          <Ext href={`${REPO}/blob/main/LICENSE`}>MIT License</Ext>
          <Link href="/developers" className="hover:text-[var(--text-primary)]">
            API
          </Link>
          <a href="/rss.xml" className="hover:text-[var(--text-primary)]">
            RSS
          </a>
        </p>
      </div>
    </footer>
  );
}
