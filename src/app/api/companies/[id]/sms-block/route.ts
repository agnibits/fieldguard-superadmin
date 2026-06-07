// POST /api/companies/:id/sms-block
// Manually block or resume SMS sending for a company. Manual block wins over
// any plan-based enforcement (FREE auto-block, PRO/ENTERPRISE unlimited).
//
// Payloads:
//   { "blocked": true,  "reason": "non-payment" }   // optional reason
//   { "blocked": false }                            // resume
//
// Block only stops SMS — in-app + push notifications continue. Each blocked
// SMS attempt is logged as FAILED in sms_logs for audit.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { SmsBlockPayload, SmsBlockResponse } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { blocked?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.blocked !== "boolean") {
    return NextResponse.json(
      { message: "Field 'blocked' (boolean) is required." },
      { status: 400 }
    );
  }

  let payload: SmsBlockPayload;
  if (body.blocked) {
    // Reason is optional per the spec; pass it through only when non-empty.
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : undefined;
    payload = reason ? { blocked: true, reason } : { blocked: true };
  } else {
    payload = { blocked: false };
  }

  try {
    const result = await callBackend<SmsBlockResponse>(
      `/api/v1/admin/companies/${encodeURIComponent(id)}/sms-block`,
      { method: "POST", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
