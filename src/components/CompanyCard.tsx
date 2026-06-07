"use client";

// Row/card representation of a company in the dashboard list. Renders as a card
// on small screens; the dashboard table uses CompanyRow for wide layouts.
import Link from "next/link";
import { Building2, Mail, Phone, ChevronRight } from "lucide-react";
import type { Company } from "@/lib/types";
import { formatDate } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import PlanBadge from "./PlanBadge";
import SmsUsageBar from "./SmsUsageBar";
import SmsBlockedBadge from "./SmsBlockedBadge";

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-card-hover focus-visible:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{company.name}</p>
            <p className="font-mono text-xs text-slate-400">{company.uniqueId}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={company.approvalStatus} size="sm" />
          {company.subscriptionPlan && (
            <PlanBadge plan={company.subscriptionPlan} size="xs" />
          )}
          {company.smsBlocked && (
            <SmsBlockedBadge reason={company.smsBlockReason} size="xs" />
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-500">
        <p className="flex items-center gap-2 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{company.email || "No email"}</span>
        </p>
        <p className="flex items-center gap-2 truncate">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{company.phone || "No phone"}</span>
        </p>
      </div>

      {company.smsUsage && (
        <div className="mt-3">
          <SmsUsageBar usage={company.smsUsage} blocked={company.smsBlocked} compact />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          Registered {formatDate(company.createdAt)}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
          Review <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

/** Table row variant used on wide screens. */
export function CompanyRow({ company }: { company: Company }) {
  return (
    <tr className="group cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-brand-50/40">
      <td className="px-4 py-3">
        <Link href={`/companies/${company.id}`} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{company.name}</p>
            <p className="font-mono text-xs text-slate-400">{company.uniqueId}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <Link href={`/companies/${company.id}`} className="block">
          <span className="block truncate">{company.email || "—"}</span>
          <span className="block text-xs text-slate-400">{company.phone || "—"}</span>
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link href={`/companies/${company.id}`} className="block w-44">
          {company.smsUsage ? (
            <SmsUsageBar usage={company.smsUsage} blocked={company.smsBlocked} compact />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        <Link href={`/companies/${company.id}`} className="block whitespace-nowrap">
          {formatDate(company.createdAt)}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link href={`/companies/${company.id}`} className="block">
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={company.approvalStatus} size="sm" />
            {company.subscriptionPlan && (
              <PlanBadge plan={company.subscriptionPlan} size="xs" />
            )}
            {company.smsBlocked && (
              <SmsBlockedBadge reason={company.smsBlockReason} size="xs" />
            )}
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/companies/${company.id}`}
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Review <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}
