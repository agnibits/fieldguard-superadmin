// Session helpers — the access token lives ONLY in an httpOnly cookie set by the
// login route handler. It is never exposed to client JS. Server code reads it here.
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fg_admin_token";

const isProd = process.env.NODE_ENV === "production";

/**
 * Cookie attributes for the session token. httpOnly so client JS can't read it,
 * secure in production, sameSite=lax so it rides along on top-level navigations.
 */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Read the access token from the request cookies (server-side only). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
