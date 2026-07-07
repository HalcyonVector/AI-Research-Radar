"use client";

import Link from "next/link";
import { Copy, ExternalLink, FileText, Heart } from "lucide-react";
import type { Model } from "@/types/model";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { useToast } from "@/components/providers/ToastProvider";
import { formatCompact } from "@/lib/formatters";

interface ModelDetailProps {
  model: Model;
}

function StatTile({ value, label, icon }: { value: number; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center gap-1.5 text-xl font-semibold tabular-nums text-[var(--text-primary)]">
        {icon}
        {formatCompact(value)}
      </div>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

export function ModelDetail({ model }: ModelDetailProps) {
  const { toast } = useToast();

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(model.hf_model_id);
      toast("Copied", "success");
    } catch {
      toast("Copy failed", "error");
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {model.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="truncate font-mono text-sm text-[var(--text-secondary)]">
              {model.hf_model_id}
            </span>
            <Button variant="ghost" size="icon" onClick={copyId} aria-label="Copy model ID" className="h-7 w-7">
              <Copy size={14} />
            </Button>
          </div>
          <div className="mt-3">
            <Badge>{model.model_type}</Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ScoreRing score={model.growth_score ?? 0} size={64} label="Growth" />
          <ScoreRing score={model.popularity_score ?? 0} size={64} label="Popularity" />
        </div>
      </div>

      {model.description && (
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {model.description}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={model.downloads_7d ?? 0} label="Downloads (7d)" />
        <StatTile value={model.downloads_30d ?? 0} label="Downloads (30d)" />
        <StatTile value={model.downloads_total ?? 0} label="Total Downloads" />
        <StatTile
          value={model.likes ?? 0}
          label="Likes"
          icon={<Heart size={16} className="text-[var(--text-tertiary)]" />}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a href={`https://huggingface.co/${model.hf_model_id}`} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="md">
            <ExternalLink size={14} />
            View on Hugging Face
          </Button>
        </a>
        {model.linked_paper_id && (
          <Link href={`/papers/${model.linked_paper_id}`}>
            <Button variant="outline" size="md">
              <FileText size={14} />
              View source paper
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
