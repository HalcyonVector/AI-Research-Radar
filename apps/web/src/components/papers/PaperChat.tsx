"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage } from "@/types/paper";

interface PaperChatProps {
  paperId: string;
}

export function PaperChat({ paperId }: PaperChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chat = useChat(paperId);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAttempt = useRef<{ question: string; history: ChatMessage[] } | null>(null);

  const send = (question: string, history: ChatMessage[]) => {
    lastAttempt.current = { question, history };
    chat.mutate(
      { question, history },
      {
        onSuccess: (res) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.answer, sources: res.sources },
          ]);
          requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
          });
        },
      }
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || chat.isPending) return;

    const history = messages;
    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    send(question, history);
  };

  const onRetry = () => {
    if (lastAttempt.current) send(lastAttempt.current.question, lastAttempt.current.history);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask This Paper</CardTitle>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Grounded Q&amp;A
        </span>
      </CardHeader>

      <div
        ref={listRef}
        className="max-h-80 space-y-4 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {messages.length === 0 && !chat.isPending && (
          <p className="py-6 text-center text-xs text-[var(--text-tertiary)]">
            Ask a question about this paper. Answers cite the sources they draw from.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {m.role === "user" ? "You" : "Radar"}
            </p>
            <div
              className={
                m.role === "user"
                  ? "border-l-2 border-[var(--text-primary)] pl-3 text-sm text-[var(--text-primary)]"
                  : "border border-[var(--rule)] bg-[var(--bg-elevated)] p-3 text-sm leading-relaxed text-[var(--text-secondary)]"
              }
            >
              {m.content}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 border-t border-[var(--rule)] pt-2">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Sources
                  </p>
                  <ul className="space-y-1">
                    {m.sources.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/papers/${s.id}`}
                          className="group flex items-baseline gap-2 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                        >
                          <span className="shrink-0 font-mono text-[var(--text-tertiary)]">
                            {s.arxiv_id}
                          </span>
                          <span className="truncate underline decoration-[var(--rule-strong)] underline-offset-2 group-hover:decoration-[var(--text-primary)]">
                            {s.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Radar
            </p>
            <div className="border border-[var(--rule)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-tertiary)]">
              Thinking…
            </div>
          </div>
        )}

        {chat.isError && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--text-secondary)]">Could not answer that.</p>
            <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the method, results, limitations…"
          className="h-9 flex-1 border border-[var(--rule-strong)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--text-primary)] focus:outline-none"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!input.trim() || chat.isPending}>
          Send
        </Button>
      </form>
    </Card>
  );
}
