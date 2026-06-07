// Plan catalogue — labels, copy, and SMS quotas all live here so the UI
// stays consistent across the badge, the plan picker, and the detail page.
// If the backend ever changes a quota or label, this is the single edit point.

import type { Plan } from "./types";

export interface PlanMeta {
  /** UI label shown to admins. */
  label: string;
  /** One-line description for the plan picker. */
  description: string;
  /** Monthly SMS quota. `null` = unlimited (ENTERPRISE). */
  smsQuota: number | null;
  /**
   * Plain-language enforcement note shown on the company detail page so the
   * admin knows what happens when the quota is reached for this plan.
   */
  smsRule: string;
}

export const PLAN_META: Record<Plan, PlanMeta> = {
  FREE: {
    label: "Free Trial",
    description: "Fresh 1-month trial. No seat cap.",
    smsQuota: 50,
    smsRule: "Free Trial auto-blocks SMS at the 50/month quota.",
  },
  STARTER: {
    label: "Starter",
    description: "Paid plan, billed by months granted.",
    smsQuota: 300,
    smsRule: "Starter auto-blocks SMS at the 300/month quota.",
  },
  GROWTH: {
    label: "Growth",
    description: "Higher-volume paid plan, billed by months granted.",
    smsQuota: 900,
    smsRule: "Growth auto-blocks SMS at the 900/month quota.",
  },
  ENTERPRISE: {
    label: "Enterprise",
    description: "Custom deal — set seat limit (or leave unlimited) and optional duration.",
    smsQuota: null,
    smsRule: "Enterprise has unlimited SMS.",
  },
};

/** Plans where the admin must enter `months` when setting the plan. */
export const PAID_TIMED_PLANS: ReadonlySet<Plan> = new Set(["STARTER", "GROWTH"]);

/** Defensive label lookup — falls back to the raw enum if a future plan slips through. */
export function planLabel(plan: Plan | undefined | null): string {
  if (!plan) return "—";
  return PLAN_META[plan]?.label ?? plan;
}

/** Short "X SMS/mo" or "Unlimited SMS" hint for the plan picker. */
export function planSmsHint(plan: Plan): string {
  const q = PLAN_META[plan].smsQuota;
  return q === null ? "Unlimited SMS" : `${q} SMS/mo · auto-blocks at quota`;
}
