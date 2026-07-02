/**
 * Client-side fetch helper for TanStack Query hooks. Calls local /api/* routes.
 * Detects the X-Demo-Data header set by the proxy when it falls back to demo data.
 */
import { useDemoStore } from "@/stores/demo";

export class ClientFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ClientFetchError";
  }
}

export async function fetchJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  const url = new URL(
    path,
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

  if (res.headers.get("X-Demo-Data") === "true") {
    try {
      useDemoStore.getState().setDemo(true);
    } catch {
      /* store not ready */
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      message = j.message || j.detail || message;
    } catch {
      /* ignore */
    }
    throw new ClientFetchError(message, res.status);
  }
  return (await res.json()) as T;
}
