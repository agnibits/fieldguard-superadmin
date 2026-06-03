// Pill for an enterprise inquiry's status. Color cue follows the spec:
// PENDING = amber, CONTACTED = blue, CLOSED = slate (neutral, "done").
import { Clock, PhoneCall, CheckCircle2 } from "lucide-react";
import type { InquiryStatus } from "@/lib/types";

const STYLES: Record<InquiryStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONTACTED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
};

const ICONS: Record<InquiryStatus, typeof Clock> = {
  PENDING: Clock,
  CONTACTED: PhoneCall,
  CLOSED: CheckCircle2,
};

const LABELS: Record<InquiryStatus, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  CLOSED: "Closed",
};

export default function InquiryStatusBadge({
  status,
  size = "sm",
}: {
  status: InquiryStatus;
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
