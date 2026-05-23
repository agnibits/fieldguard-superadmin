"use client";

// Hard-delete confirmation modal. This action is irreversible — it wipes the
// company along with its admin users, refresh tokens, and pending uploads — so
// the admin must type the company's name to confirm. Disables the delete button
// until the typed value matches exactly.
import { useEffect, useId, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function DeleteConfirmModal({
  open,
  companyName,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  companyName: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [typed, setTyped] = useState("");

  // Reset on every (re)open so a stale "confirmed" value can't carry over.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const matches = typed.trim() === companyName.trim() && companyName.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      labelledBy={titleId}
      closeOnBackdrop={!loading}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Permanently delete this company?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            This will delete{" "}
            <span className="font-semibold text-slate-700">{companyName}</span> along
            with its admin user(s), refresh tokens, and any pending document uploads.
            <span className="font-semibold text-red-600"> This cannot be undone.</span>
          </p>
        </div>
      </div>

      {/* Safety-rails recap so the admin sees what the backend will enforce. */}
      <ul className="mt-4 space-y-1.5 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5 text-xs text-red-700">
        <li>• Approved companies cannot be deleted — un-approve first.</li>
        <li>• Refused if the company has any shops or tasks attached.</li>
      </ul>

      <div className="mt-4">
        <label htmlFor="delete-confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
          Type{" "}
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
            {companyName}
          </span>{" "}
          to confirm
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={loading}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-red-500 focus:ring-2 focus:ring-red-500/40 disabled:opacity-60"
          placeholder={companyName}
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
          onClick={onConfirm}
          disabled={loading || !matches}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Permanently delete
        </button>
      </div>
    </Modal>
  );
}
