// Edge middleware: a fast first gate on protected routes. If the session cookie
// is absent, bounce to /login before rendering. Full validity (the token might be
// expired/invalid) is confirmed by the protected layout's /me check and by 401
// handling in the API client. This just avoids flashing protected UI when there's
// obviously no session.
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;

  // Already-authenticated users shouldn't sit on the login page.
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protected pages require a session cookie.
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/inquiries") ||
    pathname.startsWith("/settings");
  if (isProtected && !hasSession) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on app pages but skip Next internals, the API proxy, and static assets.
  matcher: [
    "/",
    "/login",
    "/companies/:path*",
    "/subscriptions/:path*",
    "/inquiries/:path*",
    "/settings/:path*",
  ],
};
