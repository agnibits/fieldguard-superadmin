// POST /api/enterprise-inquiries/:id/status
// Update the lead's status after the admin calls the prospect. Only CONTACTED
// or CLOSED are valid here — PENDING is the initial state and can't be set
// back. An optional internal note is forwarded as-is.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { InquiryResponse, InquiryStatusPayload } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Partial<InquiryStatusPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const status = body.status;
  if (status !== "CONTACTED" && status !== "CLOSED") {
    return NextResponse.json(
      { message: "Status must be CONTACTED or CLOSED." },
      { status: 400 }
    );
  }

  const payload: InquiryStatusPayload = { status };
  if (typeof body.note === "string" && body.note.trim().length > 0) {
    payload.note = body.note.trim();
  }

  try {
    const result = await callBackend<InquiryResponse>(
      `/api/v1/admin/enterprise-inquiries/${encodeURIComponent(id)}/status`,
      { method: "POST", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
