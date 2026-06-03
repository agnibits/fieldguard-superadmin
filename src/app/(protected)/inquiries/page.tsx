"use client";

// Enterprise call-request queue. Lists leads that came in from the customer
// app's "Talk to us" flow. The admin calls each prospect, then marks the lead
// as CONTACTED (during conversation) or CLOSED (deal done / no-go) — with an
// optional internal note. After a successful call we can also apply an
// ENTERPRISE plan directly from here, which auto-closes the inquiry.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PhoneCall,
  Building2,
  User,
  Users,
  ChevronRight,
  Phone,
  MessageSquare,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type {
  EnterpriseInquiry,
  InquiryStatus,
  SetSubscriptionPayload,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import InquiryStatusBadge from "@/components/InquiryStatusBadge";
import InquiryReviewModal from "@/components/InquiryReviewModal";
import StatusUpdateModal from "@/components/StatusUpdateModal";
import ManagePlanModal from "@/components/ManagePlanModal";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

type Filter = "ALL" | InquiryStatus;

const TABS: { key: Filter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "ALL", label: "All" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "CLOSED", label: "Closed" },
];

const EMPTY_COPY: Record<Filter, string> = {
  ALL: "No call requests yet.",
  PENDING: "No leads waiting for a call.",
  CONTACTED: "No leads in progress.",
  CLOSED: "Nothing closed yet.",
};

// Status-change dialog can target either CONTACTED or CLOSED.
type StatusDialog =
  | { open: false }
  | { open: true; target: "CONTACTED" | "CLOSED" };

export default function InquiriesPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [inquiries, setInquiries] = useState<EnterpriseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Review-drawer + nested dialog state.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusDialog, setStatusDialog] = useState<StatusDialog>({ open: false });
  const [planDialog, setPlanDialog] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(async (which: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.enterpriseInquiries(which);
      setInquiries(res.inquiries);
      if (which === "PENDING") setPendingCount(res.count);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Failed to load call requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  // Keep the Pending badge accurate even when viewing other tabs.
  useEffect(() => {
    if (filter === "PENDING") return;
    let cancelled = false;
    api
      .enterpriseInquiries("PENDING")
      .then((res) => {
        if (!cancelled) setPendingCount(res.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const selected = useMemo(
    () => inquiries.find((r) => r.id === selectedId) ?? null,
    [inquiries, selectedId]
  );

  /** Update local state after the backend returns the new row. */
  const applyUpdatedInquiry = (updated: EnterpriseInquiry) => {
    setInquiries((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      // If we're on a status-filtered tab and the inquiry moved out of it,
      // drop it so the queue reflects reality.
      if (filter !== "ALL" && updated.status !== filter) {
        return next.filter((r) => r.id !== updated.id);
      }
      return next;
    });
    if (filter === "PENDING" && updated.status !== "PENDING") {
      setPendingCount((c) => (c !== null && c > 0 ? c - 1 : c));
    }
  };

  const runStatusChange = async (
    target: "CONTACTED" | "CLOSED",
    note: string | undefined
  ) => {
    if (!selected) return;
    setActing(true);
    try {
      const res = await api.updateInquiryStatus(selected.id, { status: target, note });
      applyUpdatedInquiry(res.inquiry);
      setStatusDialog({ open: false });
      // Close the review drawer if the inquiry left the active filter.
      if (filter !== "ALL" && res.inquiry.status !== filter) {
        setSelectedId(null);
      }
      toast.success(
        target === "CONTACTED"
          ? "Marked as contacted."
          : "Marked as closed."
      );
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not update status.";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  /**
   * Apply an ENTERPRISE plan from the inquiry, then auto-close the lead with
   * an internal note describing what was applied. If the close step fails the
   * subscription is still applied — we just surface a warning so the admin
   * can close manually.
   */
  const runApplyEnterprise = async (payload: SetSubscriptionPayload) => {
    if (!selected || payload.plan !== "ENTERPRISE") return;
    setActing(true);
    try {
      await api.setSubscription(selected.company.id, payload);
      toast.success(
        `ENTERPRISE plan applied to ${selected.company.name}.`
      );
      // Best-effort auto-close, matching the spec's recommended flow.
      const seatPart =
        payload.seatLimit && payload.seatLimit > 0
          ? `${payload.seatLimit} seats`
          : "unlimited seats";
      const monthsPart = payload.months ? `, ${payload.months} months` : "";
      const closeNote = `ENTERPRISE plan applied: ${seatPart}${monthsPart}.`;
      try {
        const res = await api.updateInquiryStatus(selected.id, {
          status: "CLOSED",
          note: closeNote,
        });
        applyUpdatedInquiry(res.inquiry);
        if (filter !== "ALL" && res.inquiry.status !== filter) {
          setSelectedId(null);
        }
      } catch {
        toast.error(
          "Plan applied, but couldn't auto-close the lead. Close it manually."
        );
      }
      setPlanDialog(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not apply the plan.";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const heading = TABS.find((t) => t.key === filter)?.label ?? "Call requests";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <PhoneCall className="h-6 w-6 text-brand-600" />
          Call requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enterprise leads from the customer app&rsquo;s &ldquo;Talk to us&rdquo; flow.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          const showBadge =
            tab.key === "PENDING" && pendingCount !== null && pendingCount > 0;
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
        <ListSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(filter)} />
      ) : inquiries.length === 0 ? (
        <EmptyState
          title={`No call requests in "${heading}"`}
          description={EMPTY_COPY[filter]}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inquiries.map((r) => (
              <InquiryCard
                key={r.id}
                inquiry={r}
                onClick={() => setSelectedId(r.id)}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Showing {inquiries.length} {inquiries.length === 1 ? "request" : "requests"}
          </p>
        </>
      )}

      <InquiryReviewModal
        open={selected !== null}
        inquiry={selected}
        loading={acting}
        onClose={() => setSelectedId(null)}
        onMarkContacted={() => setStatusDialog({ open: true, target: "CONTACTED" })}
        onMarkClosed={() => setStatusDialog({ open: true, target: "CLOSED" })}
        onApplyEnterprise={() => setPlanDialog(true)}
      />

      <StatusUpdateModal
        open={statusDialog.open}
        initialTarget={statusDialog.open ? statusDialog.target : "CONTACTED"}
        companyName={selected?.company.name ?? ""}
        loading={acting}
        onClose={() => setStatusDialog({ open: false })}
        onConfirm={runStatusChange}
      />

      {/* Apply Enterprise — re-use the existing ManagePlanModal, pre-filled
          with ENTERPRISE + seat count from the lead. After a successful save
          we auto-close the inquiry (handled inside runApplyEnterprise). */}
      <ManagePlanModal
        open={planDialog}
        companyName={selected?.company.name ?? ""}
        initialPlan="ENTERPRISE"
        initialSeatLimit={selected?.expectedStaffCount ?? null}
        initialMonths={12}
        loading={acting}
        onClose={() => setPlanDialog(false)}
        onConfirm={runApplyEnterprise}
      />
    </div>
  );
}

function InquiryCard({
  inquiry,
  onClick,
}: {
  inquiry: EnterpriseInquiry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-200 hover:shadow-card-hover focus-visible:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{inquiry.company.name}</p>
            <p className="font-mono text-xs text-slate-400">{inquiry.company.uniqueId}</p>
          </div>
        </div>
        <InquiryStatusBadge status={inquiry.status} size="sm" />
      </div>

      {/* Phone + seat count — the actionable summary */}
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
          <Phone className="h-3.5 w-3.5" />
          {inquiry.contactPhone}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {inquiry.expectedStaffCount} seats
        </span>
      </div>

      <div className="mt-2 text-sm text-slate-500">
        <p className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {inquiry.message || <span className="italic text-slate-400">No message</span>}
          </span>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <User className="h-3 w-3" />
          {inquiry.requestedBy.name} · {formatDate(inquiry.createdAt)}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
          Review <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
