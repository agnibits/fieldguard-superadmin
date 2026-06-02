// Server layout for all protected pages. Validates the session by calling the
// backend /me with the cookie token; on a 401 we bounce through the
// clear-session route handler (which can actually delete the cookie — server
// components can't), and on transient backend errors we render an inline
// message so the user isn't logged out for a hiccup.
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { callBackend, Unauthenticated } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import TopBar from "@/components/TopBar";
import type { MeResponse, Admin } from "@/lib/types";

export const dynamic = "force-dynamic";

// Path of the route handler that actually deletes the cookie. Server components
// can't set cookies during render, so we redirect through this whenever the
// session needs to be cleared. Without this, a stale cookie + middleware
// /login → / redirect would loop forever.
const CLEAR_SESSION = "/api/auth/clear-session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  let admin: Admin | null = null;
  let transientError: string | null = null;

  try {
    const result = await callBackend<MeResponse>("/api/v1/admin/me", { auth: true });

    if (result.ok && result.data) {
      admin = result.data.admin;
    } else if (result.status === 401) {
      // Token is invalid or expired — clear the cookie and force a fresh login.
      redirect(CLEAR_SESSION);
    } else {
      // 5xx / network / proxy error: the session might still be perfectly
      // valid. Keep the cookie and show an inline retry — logging the user
      // out for a backend hiccup is the worse failure mode (and would also
      // loop, because re-login also needs the backend).
      transientError = result.error?.message ?? "Could not reach the backend.";
    }
  } catch (e) {
    // Unauthenticated only fires if the cookie went missing between getSessionToken
    // and the backend call (e.g. it was cleared by another tab). Clear and bounce.
    if (e instanceof Unauthenticated) redirect(CLEAR_SESSION);
    throw e;
  }

  if (transientError) {
    return <BackendUnreachable message={transientError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar admin={admin} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

function BackendUnreachable({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-800">
          Backend unreachable
        </h2>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        <p className="mt-3 text-xs text-slate-400">
          Your session is still active. The backend may be cold-starting on Render — try again in a moment.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {/* A bare <a> forces a real browser navigation, which re-runs this
              layout's session check. router.refresh() would also work but
              requires a client component for the button. */}
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Try again
          </a>
          <Link
            href={CLEAR_SESSION}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
