// POST /api/companies/:id/approval — change a company's approval status.
// Validates the payload shape before forwarding (rejection reason is required
// when rejecting) so we fail fast with a clear message.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { ApprovalPayload, CompanyResponse } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Partial<ApprovalPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const status = body.status;
  if (status !== "APPROVED" && status !== "PENDING_APPROVAL" && status !== "REJECTED") {
    return NextResponse.json(
      { message: "A valid status is required." },
      { status: 400 }
    );
  }

  let payload: ApprovalPayload;
  if (status === "REJECTED") {
    const reason = (body as { rejectionReason?: string }).rejectionReason?.trim();
    if (!reason) {
      return NextResponse.json(
        {
          message: "A rejection reason is required.",
          errors: [{ field: "rejectionReason", message: "A rejection reason is required." }],
        },
        { status: 400 }
      );
    }
    payload = { status, rejectionReason: reason };
  } else {
    payload = { status };
  }

  try {
    const result = await callBackend<CompanyResponse>(
      `/api/v1/admin/companies/${encodeURIComponent(id)}/approval`,
      { method: "POST", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
