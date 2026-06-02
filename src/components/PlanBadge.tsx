// Small pill that surfaces a company's current subscription plan.
// Color cue: FREE = slate (neutral), PRO = brand green (paying), ENTERPRISE = indigo (premium).
import { Tag, Crown, Building } from "lucide-react";
import type { Plan } from "@/lib/types";

const STYLES: Record<Plan, string> = {
  FREE: "bg-slate-100 text-slate-600 ring-slate-200",
  PRO: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ENTERPRISE: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

const ICONS: Record<Plan, typeof Tag> = {
  FREE: Tag,
  PRO: Crown,
  ENTERPRISE: Building,
};

export default function PlanBadge({
  plan,
  size = "sm",
}: {
  plan: Plan;
  size?: "xs" | "sm" | "md";
}) {
  const Icon = ICONS[plan];
  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px]"
      : size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset ${STYLES[plan]} ${sizing}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {plan}
    </span>
  );
}
