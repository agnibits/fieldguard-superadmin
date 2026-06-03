"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

// On a backend rate-limit (429), we lock the Sign-in button for this many
// seconds before letting the admin try again. Mirrors the typical backend
// rate-limit window so the next attempt is likely to succeed.
const RATE_LIMIT_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Seconds remaining in the rate-limit cooldown, or 0 when not limited.
  const [cooldown, setCooldown] = useState(0);

  // Tick the cooldown down once per second while it's active.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return; // belt + braces with the disabled button
    setError(null);
    setSubmitting(true);
    try {
      await api.login(email.trim(), password);
      // Full navigation so the server re-reads the new session cookie.
      router.replace("/");
      router.refresh();
    } catch (err) {
      // Map the status to a message that tells the admin what to do next.
      // We deliberately avoid leaking raw backend strings like "Too Many
      // Requests" or "Internal Server Error" — those don't tell the user
      // anything actionable.
      let message = "Something went wrong. Please try again.";
      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = "Invalid email or password.";
        } else if (err.status === 429) {
          message = `Too many sign-in attempts. Please wait ${RATE_LIMIT_COOLDOWN_SECONDS} seconds and try again.`;
          setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
        } else if (err.status >= 500) {
          message =
            "The backend is unavailable. It may be cold-starting — try again in a moment.";
        } else if (err.fieldErrors && err.fieldErrors.length > 0) {
          // 400 with field-level validation errors — surface the first.
          message = err.fieldErrors[0].message;
        } else {
          message = err.message;
        }
      }
      setError(message);
      setSubmitting(false);
    }
  };

  const locked = submitting || cooldown > 0;
  const buttonLabel = submitting
    ? "Signing in…"
    : cooldown > 0
    ? `Try again in ${cooldown}s`
    : "Sign in";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-white to-brand-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            FieldGuard <span className="text-brand-600">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to review company registrations.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error}
                  {cooldown > 0 && (
                    <>
                      {" "}
                      <span className="font-semibold tabular-nums">
                        ({cooldown}s)
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="admin@fieldguard.com"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={locked}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {buttonLabel}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized administrators only.
        </p>
      </div>
    </main>
  );
}
