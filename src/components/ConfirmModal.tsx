"use client";

// Generic confirmation dialog used for approve / un-approve / move-to-pending.
import { useId } from "react";
import { Loader2 } from "lucide-react";
import Modal from "./Modal";

type Tone = "brand" | "amber" | "red";

const TONE_BUTTON: Record<Tone, string> = {
  brand: "bg-brand-600 hover:bg-brand-700 text-white",
  amber: "bg-amber-500 hover:bg-amber-600 text-white",
  red: "bg-red-600 hover:bg-red-700 text-white",
};

const TONE_ICON: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "brand",
  icon,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: Tone;
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <div className="flex items-start gap-4">
        {icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TONE_ICON[tone]}`}
          >
            {icon}
          </span>
        )}
        <div className="flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
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
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${TONE_BUTTON[tone]}`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
