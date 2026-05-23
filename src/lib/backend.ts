// Server-side helpers for talking to the FieldGuard backend from route handlers.
// All authenticated calls attach the Bearer token read from the httpOnly cookie.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionToken } from "./session";
import type { BackendError } from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

/** Thrown when no session cookie is present — caller should respond 401. */
export class Unauthenticated extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "Unauthenticated";
  }
}

interface BackendCallOptions {
  method?: "GET" | "POST";
  /** When true, attach the Bearer token; throws Unauthenticated if missing. */
  auth?: boolean;
  body?: unknown;
}

export interface BackendResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: BackendError | null;
}

/**
 * Calls the backend and normalizes the response. Parses JSON defensively so a
 * non-JSON error page from the upstream doesn't blow up the proxy.
 */
export async function callBackend<T>(
  path: string,
  opts: BackendCallOptions = {}
): Promise<BackendResult<T>> {
  if (!API_BASE) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: {
        success: false,
        statusCode: 500,
        message:
          "NEXT_PUBLIC_API_BASE_URL is not configured on the server.",
        timestamp: new Date().toISOString(),
        path,
      },
    };
  }

  const headers: Record<string, string> = { Accept: "application/json" };

  if (opts.auth) {
    const token = await getSessionToken();
    if (!token) throw new Unauthenticated();
    headers.Authorization = `Bearer ${token}`;
  }

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      data: null,
      error: {
        success: false,
        statusCode: 502,
        message: "Could not reach the FieldGuard backend. Please try again.",
        timestamp: new Date().toISOString(),
        path,
      },
    };
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (res.ok) {
    return { ok: true, status: res.status, data: parsed as T, error: null };
  }

  // Build a normalized error, falling back to a generic message if the upstream
  // didn't return our expected error shape.
  const fallback: BackendError = {
    success: false,
    statusCode: res.status,
    message:
      (parsed as BackendError | null)?.message ||
      res.statusText ||
      "Request failed.",
    errors: (parsed as BackendError | null)?.errors,
    timestamp: new Date().toISOString(),
    path,
  };
  const error = parsed && typeof parsed === "object" ? { ...fallback, ...(parsed as object) } : fallback;

  return { ok: false, status: res.status, data: null, error: error as BackendError };
}

/**
 * Forwards a normalized backend result to the client as a NextResponse. On a
 * backend 401 it clears the session cookie so the client gets bounced to /login.
 */
export async function forward<T>(result: BackendResult<T>): Promise<NextResponse> {
  const payload = result.ok ? result.data : result.error;
  const response = NextResponse.json(payload, { status: result.status });

  if (result.status === 401) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

/** Response used when the proxy itself has no session cookie. */
export async function unauthenticatedResponse(): Promise<NextResponse> {
  const store = await cookies();
  store.delete?.(SESSION_COOKIE);
  return NextResponse.json(
    {
      success: false,
      statusCode: 401,
      message: "Not authenticated.",
      timestamp: new Date().toISOString(),
      path: "",
    } satisfies BackendError,
    { status: 401 }
  );
}
