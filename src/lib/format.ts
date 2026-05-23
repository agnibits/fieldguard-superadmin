import type { ApprovalStatus } from "./types";

/** Format an ISO date as e.g. "22 May 2026". Returns "—" for empty/invalid input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Human label for a status enum value. */
export function statusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
  }
}
