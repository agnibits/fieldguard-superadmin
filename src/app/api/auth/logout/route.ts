// POST /api/auth/logout — clears the session cookie. Backend has no logout endpoint
// (tokens don't refresh), so dropping the cookie ends the session client-side.
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
