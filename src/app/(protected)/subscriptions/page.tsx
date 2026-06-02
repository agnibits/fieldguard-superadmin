"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, User, CreditCard, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type {
  ReviewPayload,
  SubscriptionRequest,
  SubscriptionRequestStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import SubscriptionStatusBadge from "@/components/SubscriptionStatusBadge";
import PlanBadge from "@/components/PlanBadge";
import SubscriptionReviewModal from "@/components/SubscriptionReviewModal";
import ImageLightbox from "@/components/ImageLightbox";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

type Filter = "ALL" | SubscriptionRequestStatus;

const TABS: { key: Filter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "ALL", label: "All" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const EMPTY_COPY: Record<Filter, string> = {
  ALL: "No subscription requests yet.",
  PENDING: "Nothing waiting for review right now.",
  APPROVED: "No requests have been approved yet.",
  REJECTED: "No requests have been rejected.",
};

export default function SubscriptionsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Review modal + lightbox state.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [acting, setActing] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string | null; alt: string }>({
    src: null,
    alt: "",
  });

  const load = useCallback(async (which: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.subscriptionRequests(which);
      setRequests(res.requests);
      if (which === "PENDING") setPendingCount(res.count);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Failed to load requests.");
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
      .subscriptionRequests("PENDING")
      .then((res) => {
        if (!cancelled) setPendingCount(res.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) ?? null,
    [requests, selectedId]
  );

  const review = async (payload: ReviewPayload) => {
    if (!selected) return;
    setActing(true);
    try {
      const res = await api.reviewSubscriptionRequest(selected.id, payload);
      // Replace the updated row in-place so the list reflects the new status.
      setRequests((prev) =>
        prev.map((r) => (r.id === res.request.id ? res.request : r))
      );
      // If we're on the PENDING tab, the just-reviewed request should disappear.
      if (filter === "PENDING") {
        setRequests((prev) => prev.filter((r) => r.id !== res.request.id));
        setPendingCount((c) => (c !== null && c > 0 ? c - 1 : c));
      }
      setSelectedId(null);
      toast.success(
        payload.action === "APPROVE"
          ? `Approved · ${selected.company.name} upgraded to ${selected.plan}.`
          : `Request rejected.`
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? "This request has already been reviewed. Refreshing the queue."
            : err.message
          : "Action failed. Please try again.";
      toast.error(msg);
      if (err instanceof ApiError && err.status === 409) {
        // Refresh to get the actual current state.
        setSelectedId(null);
        load(filter);
      }
    } finally {
      setActing(false);
    }
  };

  const heading = TABS.find((t) => t.key === filter)?.label ?? "Subscriptions";

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <CreditCard className="h-6 w-6 text-brand-600" />
          Subscription requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify payment proofs and approve or reject upgrade requests.
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
      ) : requests.length === 0 ? (
        <EmptyState
          title={`No requests in "${heading}"`}
          description={EMPTY_COPY[filter]}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onClick={() => setSelectedId(r.id)}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Showing {requests.length}{" "}
            {requests.length === 1 ? "request" : "requests"}
          </p>
        </>
      )}

      <SubscriptionReviewModal
        open={selected !== null}
        request={selected}
        loading={acting}
        onClose={() => setSelectedId(null)}
        onAction={review}
        onOpenImage={(src, alt) => setLightbox({ src, alt })}
      />

      <ImageLightbox
        open={lightbox.src !== null}
        src={lightbox.src}
        alt={lightbox.alt}
        onClose={() => setLightbox({ src: null, alt: "" })}
      />
    </div>
  );
}

function RequestCard({
  request,
  onClick,
}: {
  request: SubscriptionRequest;
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
            <p className="truncate font-semibold text-slate-900">
              {request.company.name}
            </p>
            <p className="font-mono text-xs text-slate-400">
              {request.company.uniqueId}
            </p>
          </div>
        </div>
        <SubscriptionStatusBadge status={request.status} size="sm" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <PlanBadge plan={request.plan} size="xs" />
        <span className="text-xs text-slate-500">
          · {request.months} {request.months === 1 ? "mo" : "mos"}
        </span>
        <span className="ml-auto text-sm font-bold text-slate-800">
          Rs {request.amountNpr.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-500">
        <p className="flex items-center gap-2 truncate">
          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{request.requestedBy.name}</span>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          Requested {formatDate(request.createdAt)}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
          Review <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
