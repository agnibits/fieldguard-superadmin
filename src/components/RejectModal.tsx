"use client";

// Rejection dialog with a REQUIRED reason textarea. Validates before submit.
import { useEffect, useId, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import Modal from "./Modal";

export default function RejectModal({
  open,
  companyName,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  companyName: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset the field whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const invalid = trimmed.length === 0;

  const submit = () => {
    setTouched(true);
    if (invalid) return;
    onConfirm(trimmed);
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <XCircle className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Reject {companyName}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            This company will be marked as rejected and notified with the reason
            below. A reason is required.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="rejection-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
          Rejection reason <span className="text-red-600">*</span>
        </label>
        <textarea
          id="rejection-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={loading}
          rows={4}
          autoFocus
          placeholder="e.g. The registration document is unreadable. Please re-upload a clearer scan."
          className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:ring-2 focus:ring-brand-500/50 disabled:opacity-60 ${
            touched && invalid
              ? "border-red-300 focus:border-red-400"
              : "border-slate-200 focus:border-brand-500"
          }`}
        />
        {touched && invalid && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            Please provide a reason for rejection.
          </p>
        )}
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
          disabled={loading || (touched && invalid)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reject company
        </button>
      </div>
    </Modal>
  );
}
