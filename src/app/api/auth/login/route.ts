// POST /api/auth/login — proxies to the backend admin login, then stores the
// returned accessToken in an httpOnly cookie. The token is never sent to the client.
import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import type { LoginResponse, BackendError } from "@/lib/types";

// Token has no refresh; keep the cookie around for 7 days max. A backend 401 on
// any later call clears it regardless.
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const result = await callBackend<LoginResponse>("/api/v1/admin/login", {
    method: "POST",
    body: { email, password },
  });

  if (!result.ok || !result.data) {
    const err = result.error as BackendError | null;
    return NextResponse.json(
      { message: err?.message || "Invalid credentials.", errors: err?.errors },
      { status: result.status || 401 }
    );
  }

  // Only the admin profile goes back to the client; the token stays server-side.
  const response = NextResponse.json({ admin: result.data.admin });
  response.cookies.set(
    SESSION_COOKIE,
    result.data.accessToken,
    sessionCookieOptions(SESSION_MAX_AGE)
  );
  return response;
}
