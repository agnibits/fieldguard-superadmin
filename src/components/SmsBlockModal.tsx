"use client";

// Confirmation dialog for the manual SMS kill-switch. The reason field is
// optional per the backend spec — admin can block without one — but we
// encourage it via the suggestions so the audit trail isn't blank.
import { useEffect, useId, useState } from "react";
import { Loader2, Ban } from "lucide-react";
import Modal from "./Modal";

const REASON_SUGGESTIONS = [
  "Non-payment",
  "Abuse / spam complaints",
  "Investigation",
  "Temporary hold",
] as const;

export default function SmsBlockModal({
  open,
  companyName,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  companyName: string;
  loading?: boolean;
  onConfirm: (reason: string | undefined) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const submit = () => {
    const trimmed = reason.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Ban className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Stop SMS for {companyName}?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            All outgoing SMS will be blocked until resumed. In-app and push
            notifications continue to work. Each blocked attempt is logged.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="sms-block-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
          Reason <span className="text-slate-400">— optional, recommended for audit</span>
        </label>
        <input
          id="sms-block-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
          autoFocus
          placeholder="e.g. Non-payment, awaiting clearance"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
        />

        {/* Quick-pick suggestions to make the audit trail more consistent */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REASON_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setReason(s)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Stop SMS
        </button>
      </div>
    </Modal>
  );
}
