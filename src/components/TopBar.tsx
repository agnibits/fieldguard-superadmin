"use client";

// App header for protected pages: brand + nav on the left, admin identity + logout right.
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, LogOut, Loader2, Building2, CreditCard, Settings } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "./Toast";
import type { Admin } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Companies", icon: Building2 },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/settings/payment", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/companies");
  if (href === "/settings/payment") return pathname.startsWith("/settings");
  return pathname.startsWith(href);
}

export default function TopBar({ admin }: { admin: Admin | null }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-brand-700 sm:inline">
            FieldGuard <span className="font-semibold text-slate-500">Admin</span>
          </span>
        </Link>

        {/* Primary navigation. Hidden labels on the smallest screens — icons remain. */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {admin && (
            <div className="hidden text-right md:block">
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
