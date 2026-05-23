// Server layout for all protected pages. Validates the session by calling the
// backend /me with the cookie token; on any failure it clears the cookie and
// redirects to /login, so protected UI never renders without a valid session.
import { redirect } from "next/navigation";
import { callBackend, Unauthenticated } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import TopBar from "@/components/TopBar";
import type { MeResponse, Admin } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  let admin: Admin | null = null;
  try {
    const result = await callBackend<MeResponse>("/api/v1/admin/me", { auth: true });
    if (!result.ok || !result.data) {
      // Invalid/expired token (401) or any other failure → force re-login.
      redirect("/login");
    }
    admin = result.data.admin;
  } catch (e) {
    if (e instanceof Unauthenticated) redirect("/login");
    throw e;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar admin={admin} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
