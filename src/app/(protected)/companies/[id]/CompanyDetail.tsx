"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  CalendarDays,
  Hash,
  CheckCircle2,
  XCircle,
  Undo2,
  AlertCircle,
  Trash2,
  Pencil,
  Users,
  Infinity as InfinityIcon,
  Ban,
  PlayCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { ApprovalPayload, Company, SetSubscriptionPayload, SmsUsage } from "@/lib/types";
import { PLAN_META } from "@/lib/plans";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import PlanBadge from "@/components/PlanBadge";
import SmsUsageBar from "@/components/SmsUsageBar";
import SmsBlockedBadge from "@/components/SmsBlockedBadge";
import DocumentCard from "@/components/DocumentCard";
import ImageLightbox from "@/components/ImageLightbox";
import ConfirmModal from "@/components/ConfirmModal";
import RejectModal from "@/components/RejectModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import ManagePlanModal from "@/components/ManagePlanModal";
import SmsBlockModal from "@/components/SmsBlockModal";
import { DetailSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

type Dialog = "none" | "approve" | "pending" | "reject" | "delete" | "plan" | "smsBlock";

export default function CompanyDetail({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  // The detail endpoint returns smsUsage at the top level (and also nested
  // under company on list payloads) — we hold whichever surfaced.
  const [smsUsage, setSmsUsage] = useState<SmsUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [dialog, setDialog] = useState<Dialog>("none");
  const [acting, setActing] = useState(false);

  const [lightbox, setLightbox] = useState<{ src: string | null; alt: string }>({
    src: null,
    alt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await api.company(id);
      setCompany(res.company);
      // Prefer the top-level smsUsage from the detail endpoint; fall back to
      // whatever the company payload itself carries.
      setSmsUsage(res.smsUsage ?? res.company.smsUsage ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return; // redirecting
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load company.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (payload: ApprovalPayload, successMsg: string) => {
    setActing(true);
    try {
      const res = await api.setApproval(id, payload);
      setCompany(res.company); // refresh with server's canonical state
      setDialog("none");
      toast.success(successMsg);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Action failed. Please try again.";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  // Hard-delete is separate from runAction: on success there's no company state
  // to refresh — the record is gone, so we navigate back to the dashboard. On
  // failure (e.g. shops/tasks attached, or APPROVED) we keep the user on the
  // page and surface the backend's specific reason via toast.
  const runDelete = async () => {
    setActing(true);
    try {
      await api.deleteCompany(id);
      setDialog("none");
      toast.success(
        `${company?.name ?? "Company"} permanently deleted.`
      );
      // Replace so the user can't navigate back to a now-404 page.
      router.replace("/");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not delete this company. Please try again.";
      toast.error(msg);
      setActing(false);
    }
    // Note: we deliberately don't unset `acting` on success — the page is
    // navigating away and unsetting would briefly re-enable buttons.
  };

  const runSetPlan = async (payload: SetSubscriptionPayload) => {
    setActing(true);
    try {
      const res = await api.setSubscription(id, payload);
      // Server returns the updated company; merge so plan badges refresh.
      setCompany(res.company);
      setDialog("none");
      toast.success(`Plan updated to ${payload.plan}.`);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not update the plan.";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  // Manual SMS kill-switch. Stopping captures an optional reason via the
  // SmsBlockModal; resuming is a one-click confirm (no reason needed).
  const runSmsBlock = async (blocked: boolean, reason?: string) => {
    setActing(true);
    try {
      const res = await api.blockSms(id, blocked ? { blocked, reason } : { blocked });
      setCompany(res.company);
      // The block toggle doesn't change usage figures, but the backend may
      // still send refreshed smsUsage nested on company. Keep it in sync.
      if (res.company.smsUsage) setSmsUsage(res.company.smsUsage);
      setDialog("none");
      toast.success(blocked ? "SMS stopped for this company." : "SMS resumed.");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not update SMS block.";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div>
        <BackLink />
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">Company not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            This company may have been removed or the link is incorrect.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <ErrorState message={error ?? "Failed to load company."} onRetry={load} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackLink />

      {/* Company info */}
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {company.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-400">{company.uniqueId}</p>
          </div>
          <StatusBadge status={company.approvalStatus} />
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field icon={<Mail className="h-4 w-4" />} label="Email" value={company.email} />
          <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={company.phone} />
          <Field
            icon={<CreditCard className="h-4 w-4" />}
            label="PAN number"
            value={company.panNumber}
            mono
          />
          <Field
            icon={<CalendarDays className="h-4 w-4" />}
            label="Registered on"
            value={formatDate(company.createdAt)}
          />
          <Field
            icon={<Hash className="h-4 w-4" />}
            label="Company ID"
            value={String(company.id)}
            mono
          />
        </dl>

        {company.approvalStatus === "REJECTED" && company.rejectionReason && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
              <XCircle className="h-4 w-4" />
              Rejection reason
            </p>
            <p className="mt-1 text-sm leading-relaxed text-red-700/90">
              {company.rejectionReason}
            </p>
          </div>
        )}
      </section>

      {/* Subscription / plan section. Only shown once the company is APPROVED,
          since plan changes don't make sense for un-approved registrations. */}
      {company.approvalStatus === "APPROVED" && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Subscription</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Current plan and seat limit. Use Manage plan for comps or Enterprise deals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialog("plan")}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <Pencil className="h-4 w-4" />
              Manage plan
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Plan
              </dt>
              <dd className="mt-1.5">
                <PlanBadge plan={company.subscriptionPlan ?? "FREE"} size="md" />
              </dd>
            </div>
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Expires"
              value={
                company.subscriptionExpiresAt
                  ? formatDate(company.subscriptionExpiresAt)
                  : (company.subscriptionPlan ?? "FREE") === "FREE"
                  ? "—"
                  : "No expiry"
              }
            />
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Users className="h-4 w-4" />
                Seat limit
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {company.seatLimit === null || company.seatLimit === undefined ? (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <InfinityIcon className="h-4 w-4" /> Unlimited
                  </span>
                ) : (
                  company.seatLimit
                )}
              </dd>
            </div>
          </dl>

          {/* Lock-on-expire warning. Backend behaviour: when the subscription
              window closes, the company is LOCKED — no new staff and SMS
              paused — until they resubscribe. Existing data stays safe.
              Surfacing this here means the admin sees the consequence
              alongside the date. */}
          {company.subscriptionExpiresAt && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Account will LOCK on{" "}
                <span className="font-semibold">
                  {formatDate(company.subscriptionExpiresAt)}
                </span>{" "}
                if not renewed — no new staff and SMS paused until resubscribed.
                Existing data stays safe.
              </span>
            </div>
          )}
        </section>
      )}

      {/* SMS — usage this month + manual kill-switch. Only meaningful once the
          company is approved (un-approved companies can't send SMS anyway). */}
      {company.approvalStatus === "APPROVED" && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                SMS usage
                {company.smsBlocked && (
                  <SmsBlockedBadge reason={company.smsBlockReason} />
                )}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {smsUsage?.month
                  ? `Month ${smsUsage.month} · resets on the 1st (Nepal)`
                  : "Resets on the 1st of each Nepal month."}{" "}
                Includes shop-receipt, cheque-settle, and OTP. Internal alerts are
                free.
              </p>
            </div>

            {company.smsBlocked ? (
              <button
                type="button"
                onClick={() => runSmsBlock(false)}
                disabled={acting}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Resume SMS
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialog("smsBlock")}
                disabled={acting}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Ban className="h-4 w-4" />
                Stop SMS
              </button>
            )}
          </div>

          <div className="mt-5">
            {smsUsage ? (
              <SmsUsageBar usage={smsUsage} blocked={company.smsBlocked} />
            ) : (
              <p className="text-sm italic text-slate-400">
                No SMS usage data available yet.
              </p>
            )}
          </div>

          {/* Block reason — surfaced inline so admins don't have to hover */}
          {company.smsBlocked && company.smsBlockReason && (
            <p className="mt-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Block reason:</span>{" "}
              {company.smsBlockReason}
            </p>
          )}

          {/* Plan-specific footnote so the admin understands the enforcement
              rule for this company without leaving the page. */}
          <p className="mt-3 text-xs text-slate-400">
            {company.subscriptionPlan
              ? PLAN_META[company.subscriptionPlan]?.smsRule
              : "Plan-based SMS quota applies once a plan is set."}
            {" Manual block overrides any plan rule."}
          </p>
        </section>
      )}

      {/* Document review */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Document review</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentCard
            label="Citizenship image"
            src={company.citizenshipImage}
            onOpen={() =>
              setLightbox({ src: company.citizenshipImage, alt: "Citizenship image" })
            }
          />
          <DocumentCard
            label="Registration document"
            src={company.registrationDocument}
            onOpen={() =>
              setLightbox({
                src: company.registrationDocument,
                alt: "Registration document",
              })
            }
          />
        </div>
      </section>

      {/* Actions */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base font-semibold text-slate-800">Actions</h2>
        <p className="mt-1 text-sm text-slate-500">
          {company.approvalStatus === "APPROVED"
            ? "This company is approved and has access to the product."
            : company.approvalStatus === "REJECTED"
            ? "This company is rejected and cannot access the product."
            : "Review the documents above, then approve or reject this company."}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <ActionButtons
            status={company.approvalStatus}
            onApprove={() => setDialog("approve")}
            onReject={() => setDialog("reject")}
            onPending={() => setDialog("pending")}
          />
        </div>

        {/* Danger zone — only shown when the backend will actually allow it.
            APPROVED companies cannot be deleted (would wipe real users/shops);
            the admin must un-approve first. We hide the button entirely in
            that case rather than show it disabled, so the only path is the
            safe one. */}
        {company.approvalStatus !== "APPROVED" && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Permanently remove this company and all related records.
                  Cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialog("delete")}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete company
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <ImageLightbox
        open={lightbox.src !== null}
        src={lightbox.src}
        alt={lightbox.alt}
        onClose={() => setLightbox({ src: null, alt: "" })}
      />

      {/* Confirmation modals */}
      <ConfirmModal
        open={dialog === "approve"}
        title={`Approve ${company.name}?`}
        description="Approving unlocks this company's access to the FieldGuard product. You can revoke this later."
        confirmLabel="Approve"
        tone="brand"
        icon={<CheckCircle2 className="h-6 w-6" />}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={() =>
          runAction({ status: "APPROVED" }, `${company.name} has been approved.`)
        }
      />

      <ConfirmModal
        open={dialog === "pending"}
        title={
          company.approvalStatus === "APPROVED"
            ? `Un-approve ${company.name}?`
            : `Move ${company.name} to pending?`
        }
        description={
          company.approvalStatus === "APPROVED"
            ? "This revokes the company's access and sends it back to pending review."
            : "This clears the rejection and returns the company to pending review."
        }
        confirmLabel={
          company.approvalStatus === "APPROVED" ? "Un-approve" : "Move to pending"
        }
        tone="amber"
        icon={<Undo2 className="h-6 w-6" />}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={() =>
          runAction(
            { status: "PENDING_APPROVAL" },
            `${company.name} moved back to pending.`
          )
        }
      />

      <RejectModal
        open={dialog === "reject"}
        companyName={company.name}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={(reason) =>
          runAction(
            { status: "REJECTED", rejectionReason: reason },
            `${company.name} has been rejected.`
          )
        }
      />

      <DeleteConfirmModal
        open={dialog === "delete"}
        companyName={company.name}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={runDelete}
      />

      <ManagePlanModal
        open={dialog === "plan"}
        companyName={company.name}
        currentPlan={company.subscriptionPlan}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={runSetPlan}
      />

      <SmsBlockModal
        open={dialog === "smsBlock"}
        companyName={company.name}
        loading={acting}
        onClose={() => setDialog("none")}
        onConfirm={(reason) => runSmsBlock(true, reason)}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to companies
    </Link>
  );
}

function Field({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-slate-800 ${mono ? "font-mono" : ""} ${
          value ? "" : "italic text-slate-400"
        }`}
      >
        {value || "Not provided"}
      </dd>
    </div>
  );
}

/**
 * Action buttons depend on current status:
 *  - PENDING_APPROVAL: Approve (green) + Reject (red)
 *  - APPROVED:         Un-approve (amber outline) + Reject (red)
 *  - REJECTED:         Approve (green) + Move to Pending (outline)
 */
function ActionButtons({
  status,
  onApprove,
  onReject,
  onPending,
}: {
  status: Company["approvalStatus"];
  onApprove: () => void;
  onReject: () => void;
  onPending: () => void;
}) {
  const approve = (
    <button
      key="approve"
      onClick={onApprove}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
    >
      <CheckCircle2 className="h-4 w-4" />
      Approve
    </button>
  );

  const reject = (
    <button
      key="reject"
      onClick={onReject}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
    >
      <XCircle className="h-4 w-4" />
      Reject
    </button>
  );

  const unapprove = (
    <button
      key="unapprove"
      onClick={onPending}
      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
    >
      <Undo2 className="h-4 w-4" />
      Un-approve
    </button>
  );

  const moveToPending = (
    <button
      key="pending"
      onClick={onPending}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <Undo2 className="h-4 w-4" />
      Move to pending
    </button>
  );

  switch (status) {
    case "PENDING_APPROVAL":
      return (
        <>
          {approve}
          {reject}
        </>
      );
    case "APPROVED":
      return (
        <>
          {unapprove}
          {reject}
        </>
      );
    case "REJECTED":
      return (
        <>
          {approve}
          {moveToPending}
        </>
      );
  }
}
