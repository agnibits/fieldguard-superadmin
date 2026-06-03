"use client";

// Small status-change dialog used by the call-request review drawer. Lets the
// admin pick a CONTACTED or CLOSED status and attach an optional internal note.
// The opening modal sets the initial target status; the user can switch between
// CONTACTED and CLOSED before submitting.
import { useEffect, useId, useState } from "react";
import { Loader2, PhoneCall, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";

type Target = "CONTACTED" | "CLOSED";

export default function StatusUpdateModal({
  open,
  initialTarget,
  companyName,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  /** Which option is selected when the modal first opens. */
  initialTarget: Target;
  companyName: string;
  loading?: boolean;
  onConfirm: (status: Target, note: string | undefined) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [target, setTarget] = useState<Target>(initialTarget);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTarget(initialTarget);
      setNote("");
    }
  }, [open, initialTarget]);

  const submit = () => {
    const trimmed = note.trim();
    onConfirm(target, trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <h2 id={titleId} className="text-lg font-semibold text-slate-900">
        Update status
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        For <span className="font-semibold text-slate-700">{companyName}</span>&rsquo;s
        call request. The note is optional and only visible to admins.
      </p>

      {/* Target selector */}
      <div role="radiogroup" aria-label="New status" className="mt-5 grid grid-cols-2 gap-2">
        <StatusOption
          active={target === "CONTACTED"}
          onClick={() => setTarget("CONTACTED")}
          disabled={loading}
          icon={<PhoneCall className="h-4 w-4" />}
          label="Contacted"
          description="Reached out, conversation in progress."
          accent="blue"
        />
        <StatusOption
          active={target === "CLOSED"}
          onClick={() => setTarget("CLOSED")}
          disabled={loading}
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Closed"
          description="Done — deal applied or no further action."
          accent="slate"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="inquiry-note" className="mb-1.5 block text-sm font-medium text-slate-700">
          Note <span className="text-slate-400">— optional</span>
        </label>
        <textarea
          id="inquiry-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="e.g. called, quoted Rs 12,000 for 25 seats / 12 months"
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
        />
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {`Mark ${target === "CONTACTED" ? "contacted" : "closed"}`}
        </button>
      </div>
    </Modal>
  );
}

function StatusOption({
  active,
  onClick,
  disabled,
  icon,
  label,
  description,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: "blue" | "slate";
}) {
  const activeRing =
    accent === "blue"
      ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/30"
      : "border-slate-400 bg-slate-50 ring-1 ring-slate-300";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition disabled:opacity-60 ${
        active ? activeRing : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        {icon}
        {label}
      </span>
      <span className="text-xs leading-snug text-slate-500">{description}</span>
    </button>
  );
}
