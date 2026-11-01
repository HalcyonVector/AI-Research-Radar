import { NextRequest } from "next/server";
import { safeApiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

interface Briefing {
  week_start: string;
  week_end: string;
  briefing_json?: { big_stories?: { title?: string; body?: string }[] } | null;
  briefing_md: string;
  generated_at: string | null;
  is_published: boolean;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Weekly briefings as an RSS 2.0 feed, so readers can follow them without visiting. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const result = await safeApiFetch<{ data: Briefing[] }>("/briefings", { searchParams: { limit: 20 } });
  if ("error" in result) {
    return new Response("Feed temporarily unavailable", { status: result.status });
  }

  const items = result.data.data
    .filter((b) => b.is_published)
    .map((b) => {
      const title = b.briefing_json?.big_stories?.[0]?.title || `Week of ${b.week_start}`;
      const link = `${origin}/briefings/${b.week_start}`;
      const pubDate = new Date(b.generated_at || `${b.week_end}T00:00:00Z`).toUTCString();
      return `    <item>
      <title>${escape(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(b.briefing_md)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Research Radar: Weekly Briefings</title>
    <link>${origin}/briefings</link>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    <description>A weekly AI-written briefing on what moved in AI research: papers, models and repos.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
