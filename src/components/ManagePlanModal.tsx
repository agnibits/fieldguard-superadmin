"use client";

// Manual plan override modal (Section D). Lets a super-admin set a company's
// subscription directly — for comps, Enterprise deals, or fixes. Payload shape
// depends on the chosen plan:
//   FREE       → { plan: "FREE" }
//   PRO        → { plan: "PRO", months }
//   ENTERPRISE → { plan: "ENTERPRISE", seatLimit?, months? }  (both optional)
import { useEffect, useId, useState } from "react";
import { Loader2, Crown, Tag, Building } from "lucide-react";
import Modal from "./Modal";
import type { Plan, SetSubscriptionPayload } from "@/lib/types";

const PLAN_OPTIONS: { value: Plan; label: string; description: string; icon: typeof Tag }[] = [
  { value: "FREE", label: "Free", description: "Default tier. No expiry, no seat cap.", icon: Tag },
  { value: "PRO", label: "Pro", description: "Paid plan for a fixed number of months.", icon: Crown },
  {
    value: "ENTERPRISE",
    label: "Enterprise",
    description: "Custom deal — set seat limit (or leave unlimited) and optional duration.",
    icon: Building,
  },
];

export default function ManagePlanModal({
  open,
  companyName,
  currentPlan,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  companyName: string;
  currentPlan?: Plan;
  loading?: boolean;
  onConfirm: (payload: SetSubscriptionPayload) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [plan, setPlan] = useState<Plan>(currentPlan ?? "PRO");
  const [months, setMonths] = useState<string>("1");
  const [seatLimit, setSeatLimit] = useState<string>("");
  const [seatUnlimited, setSeatUnlimited] = useState(true);
  const [errors, setErrors] = useState<{ months?: string; seatLimit?: string }>({});

  // Reset to sane defaults whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setPlan(currentPlan === "FREE" ? "PRO" : (currentPlan ?? "PRO"));
      setMonths("1");
      setSeatLimit("");
      setSeatUnlimited(true);
      setErrors({});
    }
  }, [open, currentPlan]);

  const submit = () => {
    const next: typeof errors = {};
    let payload: SetSubscriptionPayload;

    if (plan === "FREE") {
      payload = { plan };
    } else if (plan === "PRO") {
      const m = Number(months);
      if (!Number.isInteger(m) || m < 1) {
        next.months = "Enter a positive integer.";
      }
      if (Object.keys(next).length) {
        setErrors(next);
        return;
      }
      payload = { plan, months: m };
    } else {
      // ENTERPRISE
      const out: SetSubscriptionPayload = { plan: "ENTERPRISE" };
      if (!seatUnlimited) {
        const sl = Number(seatLimit);
        if (!Number.isInteger(sl) || sl < 1) {
          next.seatLimit = "Enter a positive integer, or choose unlimited.";
        } else {
          out.seatLimit = sl;
        }
      }
      if (months.trim() !== "") {
        const m = Number(months);
        if (!Number.isInteger(m) || m < 1) {
          next.months = "Leave blank or enter a positive integer.";
        } else {
          out.months = m;
        }
      }
      if (Object.keys(next).length) {
        setErrors(next);
        return;
      }
      payload = out;
    }

    setErrors({});
    onConfirm(payload);
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <h2 id={titleId} className="text-lg font-semibold text-slate-900">
        Manage plan
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Set <span className="font-semibold text-slate-700">{companyName}</span>&rsquo;s
        subscription directly. For PRO, time stacks on top of any active subscription.
      </p>

      {/* Plan selector — radio cards */}
      <div role="radiogroup" aria-label="Plan" className="mt-5 space-y-2">
        {PLAN_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = plan === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPlan(opt.value)}
              disabled={loading}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition disabled:opacity-60 ${
                active
                  ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-brand-600" : "border-slate-300"
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-brand-600" />}
              </span>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Plan-specific fields */}
      {plan === "PRO" && (
        <div className="mt-4">
          <label htmlFor="months" className="mb-1.5 block text-sm font-medium text-slate-700">
            Duration (months) <span className="text-red-600">*</span>
          </label>
          <input
            id="months"
            type="number"
            inputMode="numeric"
            min={1}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            disabled={loading}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 transition focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60 ${
              errors.months ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500"
            }`}
          />
          {errors.months && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.months}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Stacks on top of any currently active PRO subscription.
          </p>
        </div>
      )}

      {plan === "ENTERPRISE" && (
        <div className="mt-4 space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Seat limit</span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="seat-mode"
                  checked={seatUnlimited}
                  onChange={() => setSeatUnlimited(true)}
                  disabled={loading}
                  className="h-4 w-4 text-brand-600"
                />
                Unlimited seats
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="seat-mode"
                  checked={!seatUnlimited}
                  onChange={() => setSeatUnlimited(false)}
                  disabled={loading}
                  className="h-4 w-4 text-brand-600"
                />
                Custom cap
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={seatLimit}
                  onChange={(e) => {
                    setSeatLimit(e.target.value);
                    setSeatUnlimited(false);
                  }}
                  disabled={loading || seatUnlimited}
                  placeholder="e.g. 25"
                  className={`ml-1 w-28 rounded-lg border px-2.5 py-1.5 text-sm text-slate-800 transition focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60 ${
                    errors.seatLimit ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500"
                  }`}
                />
              </label>
            </div>
            {errors.seatLimit && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.seatLimit}</p>
            )}
          </div>

          <div>
            <label htmlFor="ent-months" className="mb-1.5 block text-sm font-medium text-slate-700">
              Duration (months) <span className="text-slate-400">— optional</span>
            </label>
            <input
              id="ent-months"
              type="number"
              inputMode="numeric"
              min={1}
              value={months === "1" ? "" : months}
              onChange={(e) => setMonths(e.target.value || "")}
              disabled={loading}
              placeholder="Leave blank for indefinite"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 transition focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60 ${
                errors.months ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500"
              }`}
            />
            {errors.months && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.months}</p>}
          </div>
        </div>
      )}

      {plan === "FREE" && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          The company will be moved back to the FREE tier. Any active paid time will be cleared.
        </div>
      )}

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
          Save plan
        </button>
      </div>
    </Modal>
  );
}
