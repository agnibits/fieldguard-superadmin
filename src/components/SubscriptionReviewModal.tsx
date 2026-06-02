"use client";

// Review drawer for a single subscription request. Shows the payment proof image
// (clickable for full-size zoom), all metadata, and approve/reject actions.
//
// Actions are status-aware:
//   - PENDING:  Approve (green) + Reject (red, requires reason)
//   - APPROVED: read-only summary (already reviewed)
//   - REJECTED: read-only summary with reason
//
// A backend 409 on review means the request has already been actioned — we
// surface that with a clear toast so the admin can refresh the queue.

import { useEffect, useId, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  User,
  Phone,
  CalendarDays,
  Crown,
  Tag,
  Building,
  Maximize2,
} from "lucide-react";
import Modal from "./Modal";
import SubscriptionStatusBadge from "./SubscriptionStatusBadge";
import PlanBadge from "./PlanBadge";
import { formatDate } from "@/lib/format";
import type { ReviewPayload, SubscriptionRequest } from "@/lib/types";

type Action = "approve" | "reject" | null;

export default function SubscriptionReviewModal({
  open,
  request,
  loading = false,
  onAction,
  onOpenImage,
  onClose,
}: {
  open: boolean;
  request: SubscriptionRequest | null;
  loading?: boolean;
  onAction: (payload: ReviewPayload) => void;
  onOpenImage: (src: string, alt: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset every time the modal opens or the underlying request changes.
  useEffect(() => {
    if (open) {
      setAction(null);
      setReason("");
      setTouched(false);
    }
  }, [open, request?.id]);

  if (!request) return null;

  const isPending = request.status === "PENDING";
  const reasonInvalid = reason.trim().length === 0;

  const submit = () => {
    if (action === "approve") {
      onAction({ action: "APPROVE" });
      return;
    }
    if (action === "reject") {
      setTouched(true);
      if (reasonInvalid) return;
      onAction({ action: "REJECT", rejectionReason: reason.trim() });
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      labelledBy={titleId}
      closeOnBackdrop={!loading}
      size="lg"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Review subscription request
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Request #{request.id} · created {formatDate(request.createdAt)}
            </p>
          </div>
          <SubscriptionStatusBadge status={request.status} size="sm" />
        </div>

        {/* Plan + amount summary */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PlanBadge plan={request.plan} size="md" />
              <span className="text-sm text-slate-600">
                · {request.months} {request.months === 1 ? "month" : "months"}
              </span>
            </div>
            <p className="text-right">
              <span className="text-xs uppercase tracking-wide text-slate-400">Amount</span>
              <br />
              <span className="text-lg font-bold text-slate-900">
                Rs {request.amountNpr.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </div>

        {/* Company + requester */}
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <Field
            icon={<Building2 className="h-4 w-4" />}
            label="Company"
            value={
              <>
                <span className="block truncate font-medium text-slate-800">
                  {request.company.name}
                </span>
                <span className="block font-mono text-xs text-slate-400">
                  {request.company.uniqueId}
                </span>
              </>
            }
          />
          <Field
            icon={<User className="h-4 w-4" />}
            label="Requested by"
            value={
              <>
                <span className="block truncate font-medium text-slate-800">
                  {request.requestedBy.name}
                </span>
                <span className="block text-xs text-slate-500">
                  <Phone className="mr-1 inline h-3 w-3" />
                  {request.requestedBy.phone}
                </span>
              </>
            }
          />
        </dl>

        {/* Payment proof */}
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Payment proof
          </p>
          <button
            type="button"
            onClick={() => onOpenImage(request.paymentProof, "Payment proof")}
            className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            aria-label="Open payment proof full size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.paymentProof}
              alt="Payment proof"
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/30">
              <span className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" />
                View full size
              </span>
            </span>
          </button>
        </div>

        {/* Existing rejection reason, if any */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Rejection reason
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-red-700/90">
              {request.rejectionReason}
            </p>
          </div>
        )}

        {request.reviewedAt && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Reviewed on {formatDate(request.reviewedAt)}
          </p>
        )}

        {/* Reject reason input (only when "reject" mode is active) */}
        {isPending && action === "reject" && (
          <div className="mt-4">
            <label htmlFor="sub-reject-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
              Rejection reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="sub-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              disabled={loading}
              rows={3}
              autoFocus
              placeholder="e.g. Screenshot blurry / amount mismatch / wrong account"
              className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60 ${
                touched && reasonInvalid
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-brand-500"
              }`}
            />
            {touched && reasonInvalid && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                Please provide a reason for rejection.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>

          {isPending && action !== "reject" && (
            <button
              type="button"
              onClick={() => setAction("reject")}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          )}

          {isPending && action === "reject" && (
            <button
              type="button"
              onClick={submit}
              disabled={loading || (touched && reasonInvalid)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm rejection
            </button>
          )}

          {isPending && action !== "reject" && (
            <button
              type="button"
              onClick={() => {
                setAction("approve");
                onAction({ action: "APPROVE" });
              }}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading && action === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 min-w-0 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

// Re-export icon set so consumers can match if needed.
export { Crown, Tag, Building };
