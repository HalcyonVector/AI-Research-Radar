"use client";

import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, ChatResponse } from "@/types/paper";

interface ChatArgs {
  question: string;
  history: ChatMessage[];
}

async function postChat(paperId: string, args: ChatArgs): Promise<ChatResponse> {
  const res = await fetch(`/api/papers/${encodeURIComponent(paperId)}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      message = j.message || j.detail || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as ChatResponse;
}

export function useChat(paperId: string) {
  return useMutation({
    mutationFn: (args: ChatArgs) => postChat(paperId, args),
  });
}
