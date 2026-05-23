"use client";

// App header for protected pages: brand on the left, admin identity + logout right.
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "./Toast";
import type { Admin } from "@/lib/types";

export default function TopBar({ admin }: { admin: Admin | null }) {
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
      // Even if the call fails, the cookie is best-effort cleared; proceed to login.
    } finally {
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-700">
            FieldGuard <span className="font-semibold text-slate-500">Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {admin && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">
                {admin.fullName}
              </p>
              <p className="text-xs leading-tight text-slate-400">{admin.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
