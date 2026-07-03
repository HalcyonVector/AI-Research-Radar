"use client";

import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

interface Endpoint {
  method: string;
  path: string;
  desc: string;
}

const ENDPOINTS: { group: string; items: Endpoint[] }[] = [
  {
    group: "Papers",
    items: [
      { method: "GET", path: "/api/v1/papers", desc: "List & filter papers (cursor paginated)." },
      { method: "GET", path: "/api/v1/papers/{id}", desc: "Full paper detail incl. AI summary." },
      { method: "GET", path: "/api/v1/papers/{id}/related", desc: "Semantically related papers." },
      { method: "GET", path: "/api/v1/papers/compare?ids=a,b", desc: "Side-by-side compare (up to 4)." },
    ],
  },
  {
    group: "Trends & Models",
    items: [
      { method: "GET", path: "/api/v1/trends", desc: "Category momentum & growth signals." },
      { method: "GET", path: "/api/v1/trends/{slug}", desc: "Single category trend detail." },
      { method: "GET", path: "/api/v1/models", desc: "Trending open-weights models." },
      { method: "GET", path: "/api/v1/models/{id}", desc: "Model detail & adoption history." },
    ],
  },
  {
    group: "Search & Graph",
    items: [
      { method: "GET", path: "/api/v1/search?q=", desc: "Hybrid semantic + keyword search." },
      { method: "GET", path: "/api/v1/graph/paper/{id}", desc: "Citation / concept neighborhood." },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { method: "GET", path: "/api/v1/intelligence/sleeping-giants", desc: "Under-cited breakout candidates." },
      { method: "GET", path: "/api/v1/intelligence/frontier", desc: "Category explosion probabilities." },
      { method: "GET", path: "/api/v1/intelligence/dna/{id}", desc: "Conceptual composition of a paper." },
      { method: "GET", path: "/api/v1/intelligence/narratives", desc: "AI-written state-of-the-field." },
    ],
  },
];

const CURL = `curl -s https://api.airesearchradar.dev/api/v1/papers \\
  -H "Accept: application/json" \\
  -H "X-API-Key: $YOUR_KEY"   # optional — raises your rate limit`;

function MethodTag({ method }: { method: string }) {
  return (
    <span className="inline-block w-12 shrink-0 border border-[var(--rule-strong)] px-1.5 py-0.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
      {method}
    </span>
  );
}

export default function DevelopersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Public API"
        title="Developers"
        description="Read-only access to the Research Radar dataset. Stable JSON, cursor pagination, no auth required for public endpoints."
      />

      <Card>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          All endpoints below are read-only and return JSON. The base path is{" "}
          <code className="font-mono text-[var(--text-primary)]">/api/v1</code>. Requests are
          unauthenticated by default. Passing an optional{" "}
          <code className="font-mono text-[var(--text-primary)]">X-API-Key</code> header lifts your
          rate limit from the anonymous tier to the registered tier.
        </p>
      </Card>

      <div className="space-y-6">
        {ENDPOINTS.map((group) => (
          <div key={group.group}>
            <SectionHeader title={group.group} />
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
              {group.items.map((ep) => (
                <li
                  key={ep.path}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <MethodTag method={ep.method} />
                  <code className="font-mono text-sm text-[var(--text-primary)]">{ep.path}</code>
                  <span className="text-xs text-[var(--text-secondary)] sm:ml-auto sm:text-right">
                    {ep.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <SectionHeader title="Example" />
        <pre className="overflow-x-auto border border-[var(--rule)] bg-[var(--bg-base)] p-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
          {CURL}
        </pre>
      </div>

      <Card>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Rate limits
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Anonymous requests are limited per IP. Supplying{" "}
          <code className="font-mono text-[var(--text-primary)]">X-API-Key</code> raises the limit
          and enables burst allowances. Keys are optional for all public read endpoints — no key is
          required to explore the data.
        </p>
      </Card>
    </div>
  );
}
