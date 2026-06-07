"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { ApprovalStatus, Company } from "@/lib/types";
import CompanyCard, { CompanyRow } from "@/components/CompanyCard";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/States";

type Filter = "ALL" | ApprovalStatus;

const TABS: { key: Filter; label: string }[] = [
  { key: "PENDING_APPROVAL", label: "Pending" },
  { key: "ALL", label: "All" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const EMPTY_COPY: Record<Filter, string> = {
  ALL: "No companies have registered yet.",
  PENDING_APPROVAL: "No companies are awaiting review.",
  APPROVED: "No companies have been approved yet.",
  REJECTED: "No companies have been rejected.",
};

export default function DashboardPage() {
  // Pending is the default and most important tab.
  const [filter, setFilter] = useState<Filter>("PENDING_APPROVAL");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pending count drives the badge; fetched once and kept fresh on reload.
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const load = useCallback(
    async (which: Filter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.companies(which);
        setCompanies(res.companies);
        if (which === "PENDING_APPROVAL") {
          setPendingCount(res.count);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return; // redirecting
        setError(
          err instanceof Error ? err.message : "Failed to load companies."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  // Keep the pending badge accurate even when viewing other tabs.
  useEffect(() => {
    if (filter === "PENDING_APPROVAL") return;
    let cancelled = false;
    api
      .companies("PENDING_APPROVAL")
      .then((res) => {
        if (!cancelled) setPendingCount(res.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const heading = useMemo(() => {
    const t = TABS.find((t) => t.key === filter);
    return t?.label ?? "Companies";
  }, [filter]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review registrations and manage approval status.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          const showBadge =
            tab.key === "PENDING_APPROVAL" && pendingCount !== null && pendingCount > 0;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative inline-flex items-center gap-2 rounded-t-lg px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {showBadge && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    active ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(filter)} />
      ) : companies.length === 0 ? (
        <EmptyState
          title={`No companies in "${heading}"`}
          description={EMPTY_COPY[filter]}
        />
      ) : (
        <>
          {/* Card grid — mobile & tablet */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>

          {/* Table — wide screens */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Company
                    </span>
                  </th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">SMS this month</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <CompanyRow key={c.id} company={c} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Showing {companies.length} {companies.length === 1 ? "company" : "companies"}
          </p>
        </>
      )}
    </div>
  );
}
