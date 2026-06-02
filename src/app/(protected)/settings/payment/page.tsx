"use client";

// Payment QR settings page.
//
// Upload flow (S3 presigned PUT):
//   1) Admin picks a file in the file input.
//   2) We ask our proxy for an upload URL: GET /api/payment-setting/upload-url
//      with the file's extension + MIME. The proxy forwards to the backend,
//      which returns { uploadUrl, imageKey }.
//   3) Browser PUTs the file bytes DIRECTLY to S3 at uploadUrl, with
//      Content-Type matching the MIME we sent — S3 rejects otherwise.
//   4) Once S3 returns 200, we call PUT /api/payment-setting with the
//      imageKey (and optionally the note). Backend persists and returns
//      the new public qrImageUrl + note.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Upload,
  Loader2,
  Save,
  ImageOff,
  CheckCircle2,
  FileImage,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { PaymentSetting } from "@/lib/types";
import { ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap — matches typical S3 policy.

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export default function PaymentSettingsPage() {
  const toast = useToast();
  const [setting, setSetting] = useState<PaymentSetting | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local file state — selected but not yet uploaded.
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.paymentSetting();
      setSetting(res.payment);
      setNote(res.payment?.paymentNote ?? "");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Track an object URL for the local preview and clean it up on change/unmount.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }
    if (!MIME_TO_EXT[selected.type]) {
      toast.error("Only PNG, JPEG, or WebP images are allowed.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const noteDirty = note !== (setting?.paymentNote ?? "");
  const canSave = (file !== null || noteDirty) && !saving;

  const save = async () => {
    setSaving(true);
    try {
      let imageKey: string | undefined;

      if (file) {
        // Step 1 — get presigned URL + imageKey for this file's MIME.
        const ext = MIME_TO_EXT[file.type];
        const { uploadUrl, imageKey: key } = await api.paymentUploadUrl(ext, file.type);

        // Step 2 — PUT the file bytes directly to S3.
        await api.uploadToS3(uploadUrl, file);

        imageKey = key;
      }

      // Step 3 — tell the backend about the new key and/or note.
      const payload: { qrImageKey?: string; paymentNote?: string } = {};
      if (imageKey) payload.qrImageKey = imageKey;
      if (noteDirty) payload.paymentNote = note;

      const res = await api.updatePaymentSetting(payload);
      setSetting(res.payment);
      setNote(res.payment?.paymentNote ?? "");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Payment settings saved.");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not save. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div>
        <Header />
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current QR + preview */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-semibold text-slate-800">
            {file ? "New QR (preview)" : "Current QR"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {file
              ? "This is what users will see after you save."
              : setting?.qrImageUrl
              ? "Customers scan this to pay."
              : "No QR uploaded yet."}
          </p>

          <div className="mt-4 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
            {loading ? (
              <div className="skeleton h-64 w-64 rounded-lg" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="New QR preview"
                className="h-64 w-64 rounded-lg object-contain shadow-card"
              />
            ) : setting?.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={setting.qrImageUrl}
                alt="Current payment QR"
                className="h-64 w-64 rounded-lg object-contain shadow-card"
              />
            ) : (
              <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white text-slate-400">
                <ImageOff className="h-8 w-8" />
                <span className="text-sm font-medium">Not set</span>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-brand-700">
                <FileImage className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">{file.name}</span>
                <span className="shrink-0 text-brand-600/80">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                onClick={clearFile}
                disabled={saving}
                className="font-semibold text-brand-700 transition hover:text-brand-800 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
        </section>

        {/* Controls */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-semibold text-slate-800">Update settings</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Replace the QR image and/or change the payment note. Both are optional —
            update only what you need.
          </p>

          {/* File picker */}
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              New QR image
            </label>
            <label
              htmlFor="qr-file"
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                saving
                  ? "cursor-not-allowed opacity-60"
                  : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/40"
              }`}
            >
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                Click to choose a file
              </span>
              <span className="text-xs text-slate-400">
                PNG, JPEG, or WebP · up to 5 MB
              </span>
              <input
                id="qr-file"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={saving}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          {/* Note textarea */}
          <div className="mt-5">
            <label htmlFor="payment-note" className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment note
            </label>
            <textarea
              id="payment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving || loading}
              rows={3}
              placeholder="e.g. eSewa 98XXXXXXXX — scan & pay Rs 999"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-400">
              Shown next to the QR on the customer payment screen.
            </p>
          </div>

          {/* Save / status */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {file && noteDirty
                ? "Will upload new QR and update note."
                : file
                ? "Will upload new QR."
                : noteDirty
                ? "Will update note only."
                : "No changes yet."}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {!loading && setting && !file && !noteDirty && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
              Settings are up to date.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
        <CreditCard className="h-6 w-6 text-brand-600" />
        Payment QR
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The QR code customers scan to pay for subscriptions. Update when the receiving
        account or amount changes.
      </p>
    </div>
  );
}
