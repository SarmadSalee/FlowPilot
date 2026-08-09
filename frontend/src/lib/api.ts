import { toast } from "sonner";

const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let token = "";

export function setToken(t: string) {
  token = t;
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Unexpected response (${res.status})`, res.status);
  }

  const r = json as { success?: boolean; data?: T; error?: string };
  if (!res.ok || r.success === false) {
    const msg = r.error ?? `Request failed (${res.status})`;
    if (res.status === 401) {
      toast.error("Session expired, please sign in again.");
    }
    throw new ApiError(msg, res.status);
  }
  return r.data as T;
}

export async function httpText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || `Request failed (${res.status})`, res.status);
  }
  return res.text();
}

export { BASE };