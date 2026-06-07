"use client";

// Manual plan override modal. Lets a super-admin set a company's subscription
// directly — for comps, Enterprise deals, or fixes. Payload shape per plan:
//   FREE                  → { plan: "FREE" }
//   STARTER / GROWTH      → { plan, months }            // months required
//   ENTERPRISE            → { plan, seatLimit?, months? }
//
// Expiry note: every paid plan (and the FREE trial itself) LOCKS the account
// when its time runs out — new staff can't be added and SMS is paused until
// resubscribed. Existing data stays safe. The copy below mentions this so the
// admin sees the consequence before saving.

import { useEffect, useId, useState } from "react";
import { Loader2, Tag, Sparkles, Rocket, Building } from "lucide-react";
import Modal from "./Modal";
import type { Plan, SetSubscriptionPayload } from "@/lib/types";
import { PLAN_META, PAID_TIMED_PLANS } from "@/lib/plans";

// Order matters — this is the order shown in the picker.
const PLAN_ORDER: Plan[] = ["FREE", "STARTER", "GROWTH", "ENTERPRISE"];

const PLAN_ICONS: Record<Plan, typeof Tag> = {
  FREE: Tag,
  STARTER: Sparkles,
  GROWTH: Rocket,
  ENTERPRISE: Building,
};

export default function ManagePlanModal({
  open,
  companyName,
  currentPlan,
  initialPlan,
  initialMonths,
  initialSeatLimit,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  companyName: string;
  currentPlan?: Plan;
  /** Pre-select a plan when opened (e.g. ENTERPRISE from a call-request flow). */
  initialPlan?: Plan;
  /** Pre-fill the months field. */
  initialMonths?: number;
  /** Pre-fill the seat limit (and switch off "Unlimited"). */
  initialSeatLimit?: number | null;
  loading?: boolean;
  onConfirm: (payload: SetSubscriptionPayload) => void;
  onClose: () => void;
}) {
  const titleId = useId();

  // Default selection ladder: explicit initialPlan → current plan (unless on
  // FREE — in which case STARTER is the natural upgrade target) → STARTER.
  const defaultPlan = (): Plan =>
    initialPlan ?? (currentPlan && currentPlan !== "FREE" ? currentPlan : "STARTER");

  const [plan, setPlan] = useState<Plan>(defaultPlan());
  const [months, setMonths] = useState<string>(
    initialMonths !== undefined ? String(initialMonths) : "1"
  );
  const [seatLimit, setSeatLimit] = useState<string>(
    initialSeatLimit !== undefined && initialSeatLimit !== null
      ? String(initialSeatLimit)
      : ""
  );
  const [seatUnlimited, setSeatUnlimited] = useState(
    initialSeatLimit === undefined || initialSeatLimit === null
  );
  const [errors, setErrors] = useState<{ months?: string; seatLimit?: string }>({});

  // Reset to (initial defaults || sane fallbacks) whenever the modal is (re)opened.
  // The dependency list intentionally re-syncs when the caller swaps in new initial
  // values — e.g. opening the modal for a different inquiry.
  useEffect(() => {
    if (!open) return;
    setPlan(defaultPlan());
    setMonths(initialMonths !== undefined ? String(initialMonths) : "1");
    setSeatLimit(
      initialSeatLimit !== undefined && initialSeatLimit !== null
        ? String(initialSeatLimit)
        : ""
    );
    setSeatUnlimited(initialSeatLimit === undefined || initialSeatLimit === null);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentPlan, initialPlan, initialMonths, initialSeatLimit]);

  const submit = () => {
    const next: typeof errors = {};
    let payload: SetSubscriptionPayload;

    if (plan === "FREE") {
      payload = { plan };
    } else if (PAID_TIMED_PLANS.has(plan)) {
      // STARTER / GROWTH — months required, no seat limit.
      const m = Number(months);
      if (!Number.isInteger(m) || m < 1) {
        next.months = "Enter a positive integer.";
      }
      if (Object.keys(next).length) {
        setErrors(next);
        return;
      }
      payload = { plan: plan as "STARTER" | "GROWTH", months: m };
    } else {
      // ENTERPRISE — both seatLimit and months optional, validated if given.
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

  const meta = PLAN_META[plan];

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} labelledBy={titleId} closeOnBackdrop={!loading}>
      <h2 id={titleId} className="text-lg font-semibold text-slate-900">
        Manage plan
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Set <span className="font-semibold text-slate-700">{companyName}</span>&rsquo;s
        subscription directly. Months stack on top of any active paid time.
      </p>

      {/* Plan selector — radio cards */}
      <div role="radiogroup" aria-label="Plan" className="mt-5 space-y-2">
        {PLAN_ORDER.map((value) => {
          const optMeta = PLAN_META[value];
          const Icon = PLAN_ICONS[value];
          const active = plan === value;
          const smsHint =
            optMeta.smsQuota === null
              ? "Unlimited SMS"
              : `${optMeta.smsQuota} SMS/mo · auto-blocks at quota`;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPlan(value)}
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
                <p className="text-sm font-semibold text-slate-800">{optMeta.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {optMeta.description}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{smsHint}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Plan-specific fields */}
      {PAID_TIMED_PLANS.has(plan) && (
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
            Stacks on top of any active {meta.label} time. Account LOCKS on
            expiry (no new staff, SMS off) until resubscribed.
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
            <p className="mt-1 text-xs text-slate-400">
              When months is set, the account LOCKS on expiry until renewed.
              Leave blank for an open-ended deal.
            </p>
          </div>
        </div>
      )}

      {plan === "FREE" && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Grants a fresh 1-month trial. Any active paid time will be cleared.
          Account LOCKS when the trial ends until a paid plan is set.
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
