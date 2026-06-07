// Compact SMS usage indicator: "SMS: 6 / 300 · 294 left" + a thin progress bar.
// Handles three states:
//   - unlimited (ENTERPRISE): "SMS: 6 / ∞" with no bar
//   - over-quota: red (FREE → blocked; PRO → just a warning)
//   - normal: brand green; amber after 70%
//
// `blocked` overrides the colour to red so a manually-blocked row reads as
// stopped even when usage is well under quota.
import { MessageSquare } from "lucide-react";
import type { SmsUsage } from "@/lib/types";

export default function SmsUsageBar({
  usage,
  blocked = false,
  compact = false,
}: {
  usage: SmsUsage | undefined;
  blocked?: boolean;
  /** When true, renders a single-line condensed variant for card/row use. */
  compact?: boolean;
}) {
  // Defensive: no usage payload → render nothing rather than break the row.
  if (!usage) return null;

  if (usage.unlimited) {
    return (
      <div
        className={`flex items-center gap-1.5 text-slate-500 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
        <span>
          SMS: <span className="font-semibold text-slate-700">{usage.used}</span>
          <span className="px-1 text-slate-400">/</span>
          <span className="font-semibold text-slate-700" aria-label="unlimited">
            ∞
          </span>
        </span>
      </div>
    );
  }

  const quota = usage.quota ?? 0;
  // Clamp the bar at 100% so over-quota doesn't overflow visually, while still
  // colouring it red. Avoid divide-by-zero if quota is 0.
  const pctRaw = quota > 0 ? (usage.used / quota) * 100 : 0;
  const pct = Math.min(100, Math.max(0, pctRaw));

  // Colour bands: amber when getting close, red when over OR manually blocked.
  let barColor = "bg-brand-500";
  let textColor = "text-slate-500";
  if (blocked || usage.overQuota) {
    barColor = "bg-red-500";
    textColor = "text-red-700";
  } else if (pctRaw >= 70) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
  }

  const remaining = usage.remaining ?? Math.max(0, quota - usage.used);

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div
        className={`flex items-center gap-1.5 ${textColor} ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">
          SMS: <span className="font-semibold text-slate-700">{usage.used}</span>
          <span className="px-1 text-slate-400">/</span>
          <span className="font-semibold text-slate-700">{quota}</span>
          <span className="px-1.5 text-slate-300">·</span>
          <span className="font-medium">
            {usage.overQuota ? "over quota" : `${remaining} left`}
          </span>
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(pctRaw)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="SMS usage"
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
