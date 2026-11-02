"use client";

import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const SHOW_AFTER_MS = 4000;

/** The API runs on a free instance that sleeps when idle and takes up to a
 * minute to wake. If requests are still pending after a few seconds, say so
 * instead of leaving a page of skeletons that looks broken. */
export function ServerWakeNotice() {
  // Only requests the current page is waiting on: a slow request left over
  // from the previous page shouldn't put the notice over a page that's done.
  const fetching = useIsFetching({ predicate: (q) => q.getObserversCount() > 0 }) > 0;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!fetching) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [fetching]);

  if (!show) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border border-[var(--rule-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-lg"
    >
      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--text-primary)] align-middle" />
      Waking up the server. It sleeps when idle, so the first load can take up to a minute.
    </div>
  );
}
