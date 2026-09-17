const TOKEN_KEY = "vertex_token";

/**
 * Normalize the configured API URL.
 *
 * NEXT_PUBLIC_API_URL is often pasted without a scheme ("my-api.vercel.app/api").
 * Without "https://" the browser treats it as a relative path and requests it from the
 * frontend's own origin, which answers with an HTML 404. Accept every reasonable form:
 *   "https://host/api"      -> used as is
 *   "host/api"              -> "https://host/api"
 *   "//host/api"            -> "https://host/api"
 *   "/api"                  -> same-origin path
 */
function normalizeBaseUrl(raw: string | undefined): string {
  let v = (raw ?? "").trim();
  while (v.endsWith("/")) v = v.slice(0, -1);
  if (!v) return "http://localhost:5000/api";

  const lower = v.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) return v;
  if (v.startsWith("//")) return `https:${v}`;
  if (v.startsWith("/")) return v;
  return `https://${v}`;
}

/**
 * Backend base URL. The frontend is a separate app and connects to the backend only
 * through this URL (NEXT_PUBLIC_API_URL), e.g. http://localhost:5000/api
 */
export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

type Detail = { path: string; message: string };

export class ApiError extends Error {
  status: number;
  details?: Detail[];

  constructor(status: number, message: string, details?: Detail[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const url = `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Cannot reach the backend at ${API_BASE_URL}. Is the API server running?`);
  }

  // Only trust JSON bodies. Anything else (an HTML error page, a proxy message) becomes a
  // short readable error instead of a raw dump.
  let data: unknown = null;
  const text = await res.text();
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (text && isJson) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const payload = (data ?? {}) as { error?: string; details?: Detail[] };
    if (res.status === 401 && typeof window !== "undefined") {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    }
    const fallback = !isJson
      ? `The backend at ${API_BASE_URL} returned ${res.status} instead of JSON. Check NEXT_PUBLIC_API_URL (it must include https://) and that the API is running.`
      : `Request failed (${res.status}).`;
    throw new ApiError(res.status, payload.error ?? fallback, payload.details);
  }
  if (text && !isJson) {
    throw new ApiError(0, `Unexpected response from ${API_BASE_URL}. Check that NEXT_PUBLIC_API_URL points to the backend API.`);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details?.length) {
      return err.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
