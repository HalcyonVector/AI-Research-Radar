/**
 * Server-side typed fetch wrapper. Used only inside route handlers (app/api/*).
 * Proxies to the FastAPI backend and injects the Authorization header.
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";
const API_SECRET_KEY = process.env.API_SECRET_KEY || "";
const API_PREFIX = "/api/v1";
const DEFAULT_TIMEOUT_MS = 8000;

export interface UpstreamError {
  error: true;
  message: string;
  status: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface FetchOptions {
  method?: string;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  revalidate?: number;
  /** Override the default 8s upstream timeout — some routes (e.g. search, which
   * may cold-load a local embedding model on first call) legitimately need longer. */
  timeoutMs?: number;
  /** Extra headers merged into the upstream request (e.g. X-Client-Id). */
  headers?: Record<string, string>;
}

function buildUrl(path: string, searchParams?: FetchOptions["searchParams"]): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${API_PREFIX}${clean}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Perform a request to the upstream API. Throws ApiError on non-2xx or network failure.
 */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.searchParams);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };
  if (API_SECRET_KEY) headers["Authorization"] = `Bearer ${API_SECRET_KEY}`;
  if (opts.body) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    res = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Upstream request timed out"
        : `Cannot reach backend at ${API_BASE_URL}`;
    throw new ApiError(message, 503);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail || j.message || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(detail || `Upstream error ${res.status}`, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("Invalid JSON from upstream", 502);
  }
}

/**
 * Helper used by route handlers: run a fetch and translate errors into a NextResponse-friendly
 * tuple. Returns { data } on success or { error, status } on failure.
 */
export async function safeApiFetch<T>(
  path: string,
  opts: FetchOptions = {}
): Promise<{ data: T } | { error: UpstreamError; status: number }> {
  try {
    const data = await apiFetch<T>(path, opts);
    return { data };
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      error: { error: true, message, status },
      status,
    };
  }
}
