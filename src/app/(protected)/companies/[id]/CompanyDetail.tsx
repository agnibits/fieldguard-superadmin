"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { ApprovalPayload, Company } from "@/lib/types";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import DocumentCard from "@/components/DocumentCard";
import ImageLightbox from "@/components/ImageLightbox";
import ConfirmModal from "@/components/ConfirmModal";
import RejectModal from "@/components/RejectModal";
import { DetailSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

type Dialog = "none" | "approve" | "pending" | "reject";

export default function CompanyDetail({ id }: { id: string }) {
  const toast = useToast();
  const [company, setCompany] = useState<Company | null>(null);
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
