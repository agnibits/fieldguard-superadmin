// Red "SMS Blocked" pill. The reason (if any) shows on hover via title attr —
// keeps the row compact while still discoverable.
import { Ban } from "lucide-react";

export default function SmsBlockedBadge({
  reason,
  size = "sm",
}: {
  reason?: string | null;
  size?: "xs" | "sm";
}) {
  const sizing =
    size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      title={reason ? `Reason: ${reason}` : undefined}
      className={`inline-flex items-center gap-1 rounded-full bg-red-50 font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 ${sizing}`}
    >
      <Ban className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      SMS Blocked
    </span>
  );
}
