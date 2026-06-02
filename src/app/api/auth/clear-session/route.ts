// GET /api/auth/clear-session
//
// Server-component-friendly cookie clear. The protected layout can't set
// cookies during render (server components are read-only for cookies in App
// Router), so when it detects a stale or invalid session it redirects through
// this route handler instead. The handler clears the session cookie via a
// Set-Cookie header and bounces to /login.
//
// This breaks the redirect loop that would otherwise occur:
//   layout calls /me → 401 → redirect("/login")
//   /login route → middleware sees cookie present → redirect("/")
//   /  → layout → /me → 401 → redirect("/login")
//   ... forever.
//
// With this handler in the middle, the cookie is gone by the time the browser
// reaches /login, so middleware lets the request through.
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
