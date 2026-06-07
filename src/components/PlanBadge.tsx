// Small pill that surfaces a company's current subscription plan.
// Color cue (rough tier ladder so the eye reads them in order):
//   FREE       = slate  (neutral default / trial)
//   STARTER    = blue   (entry-level paid)
//   GROWTH     = brand  (mid-tier — the "popular" lane)
//   ENTERPRISE = indigo (premium / custom)
import { Tag, Sparkles, Rocket, Building } from "lucide-react";
import type { Plan } from "@/lib/types";
import { planLabel } from "@/lib/plans";

const STYLES: Record<Plan, string> = {
  FREE: "bg-slate-100 text-slate-600 ring-slate-200",
  STARTER: "bg-blue-50 text-blue-700 ring-blue-600/20",
  GROWTH: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ENTERPRISE: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

const ICONS: Record<Plan, typeof Tag> = {
  FREE: Tag,
  STARTER: Sparkles,
  GROWTH: Rocket,
  ENTERPRISE: Building,
};

export default function PlanBadge({
  plan,
  size = "sm",
}: {
  plan: Plan;
  size?: "xs" | "sm" | "md";
}) {
  // Defensive default for unknown plans (shouldn't happen, but avoid crashes
  // if backend ever sends a value not in our enum).
  const Icon = ICONS[plan] ?? Tag;
  const style = STYLES[plan] ?? STYLES.FREE;
  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px]"
      : size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset ${style} ${sizing}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {planLabel(plan)}
    </span>
  );
}
