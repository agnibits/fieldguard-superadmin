// Pill for subscription request status. Mirrors StatusBadge styling but for the
// PENDING/APPROVED/REJECTED set used by the verification queue.
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { SubscriptionRequestStatus } from "@/lib/types";

const STYLES: Record<SubscriptionRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  APPROVED: "bg-brand-50 text-brand-700 ring-brand-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
};

const ICONS: Record<SubscriptionRequestStatus, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const LABELS: Record<SubscriptionRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function SubscriptionStatusBadge({
  status,
  size = "sm",
}: {
  status: SubscriptionRequestStatus;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[status];
  const sizing =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs sm:text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${STYLES[status]} ${sizing}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {LABELS[status]}
    </span>
  );
}
