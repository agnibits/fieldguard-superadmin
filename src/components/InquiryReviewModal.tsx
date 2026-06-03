"use client";

// Review drawer for an enterprise call-request lead. Surfaces the full message,
// metadata, and three actions:
//   1) Mark Contacted   — opens StatusUpdateModal (pre-selected to CONTACTED)
//   2) Mark Closed      — opens StatusUpdateModal (pre-selected to CLOSED)
//   3) Apply Enterprise — opens ManagePlanModal pre-filled with ENTERPRISE +
//                         seatLimit from the inquiry. The caller is responsible
//                         for closing the inquiry after a successful apply.
//
// The phone number is click-to-call (tel:) so the admin can dial from the
// browser/device directly.
import Link from "next/link";
import { useId } from "react";
import {
  Building2,
  User,
  Phone,
  CalendarDays,
  Users,
  MessageSquare,
  StickyNote,
  PhoneCall,
  CheckCircle2,
  Crown,
  ExternalLink,
} from "lucide-react";
import Modal from "./Modal";
import InquiryStatusBadge from "./InquiryStatusBadge";
import { formatDate } from "@/lib/format";
import type { EnterpriseInquiry } from "@/lib/types";

export default function InquiryReviewModal({
  open,
  inquiry,
  loading = false,
  onMarkContacted,
  onMarkClosed,
  onApplyEnterprise,
  onClose,
}: {
  open: boolean;
  inquiry: EnterpriseInquiry | null;
  loading?: boolean;
  onMarkContacted: () => void;
  onMarkClosed: () => void;
  onApplyEnterprise: () => void;
  onClose: () => void;
}) {
  const titleId = useId();

  if (!inquiry) return null;

  const isPending = inquiry.status === "PENDING";
  const isContacted = inquiry.status === "CONTACTED";
  const isClosed = inquiry.status === "CLOSED";

  // tel: links work best with digits only — keep the leading + if present.
  const telHref = `tel:${inquiry.contactPhone.replace(/[^\d+]/g, "")}`;

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      labelledBy={titleId}
      closeOnBackdrop={!loading}
      size="lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Enterprise call request
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Request #{inquiry.id} · received {formatDate(inquiry.createdAt)}
          </p>
        </div>
        <InquiryStatusBadge status={inquiry.status} size="sm" />
      </div>

      {/* Headline: phone + seat count, primary action targets */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Contact phone
          </p>
          <a
            href={telHref}
            className="mt-1 inline-flex items-center gap-1.5 text-lg font-bold text-brand-700 hover:text-brand-800"
          >
            <Phone className="h-4 w-4" />
            {inquiry.contactPhone}
          </a>
          <p className="mt-0.5 text-xs text-slate-500">Click to call</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Expected staff
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-lg font-bold text-slate-800">
            <Users className="h-4 w-4 text-slate-500" />
            {inquiry.expectedStaffCount} seats
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Use as ENTERPRISE seat cap</p>
        </div>
      </div>

      {/* Company + requester */}
      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field
          icon={<Building2 className="h-4 w-4" />}
          label="Company"
          value={
            <Link
              href={`/companies/${inquiry.companyId}`}
              className="group inline-flex items-center gap-1 text-slate-800 hover:text-brand-700"
            >
              <span className="block">
                <span className="block truncate font-medium">{inquiry.company.name}</span>
                <span className="block font-mono text-xs text-slate-400">
                  {inquiry.company.uniqueId}
                </span>
              </span>
              <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </Link>
          }
        />
        <Field
          icon={<User className="h-4 w-4" />}
          label="Requested by"
          value={
            <>
              <span className="block truncate font-medium text-slate-800">
                {inquiry.requestedBy.name}
              </span>
              <span className="block text-xs text-slate-500">
                {inquiry.requestedBy.phone}
              </span>
            </>
          }
        />
      </dl>

      {/* Customer message */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          <MessageSquare className="h-3.5 w-3.5" />
          Customer message
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {inquiry.message || <span className="italic text-slate-400">No message</span>}
        </p>
      </div>

      {/* Existing admin note (if any) */}
      {inquiry.adminNote && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <StickyNote className="h-3.5 w-3.5" />
            Internal note
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {inquiry.adminNote}
          </p>
        </div>
      )}

      {inquiry.handledAt && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          Last handled on {formatDate(inquiry.handledAt)}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Close
        </button>

        {/* Mark Contacted — available on PENDING. Hidden on CLOSED. */}
        {(isPending || isContacted) && (
          <button
            type="button"
            onClick={onMarkContacted}
            disabled={loading || isContacted}
            title={isContacted ? "Already marked contacted" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PhoneCall className="h-4 w-4" />
            Mark contacted
          </button>
        )}

        {/* Mark Closed — available unless already closed. */}
        {!isClosed && (
          <button
            type="button"
            onClick={onMarkClosed}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark closed
          </button>
        )}

        {/* Apply Enterprise — the natural closing action when the call goes
            well. Available on any open status; we don't show it on CLOSED
            because the company should already have a plan by then. */}
        {!isClosed && (
          <button
            type="button"
            onClick={onApplyEnterprise}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Crown className="h-4 w-4" />
            Apply Enterprise plan
          </button>
        )}
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
