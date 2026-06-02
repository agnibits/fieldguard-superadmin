// POST /api/subscription-requests/:id/review
// Approve or reject a PENDING subscription request. A 409 from the backend means
// the request has already been reviewed (only PENDING requests are reviewable).
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { ReviewPayload, ReviewResponse } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Partial<ReviewPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json(
      { message: "A valid action is required (APPROVE or REJECT)." },
      { status: 400 }
    );
  }

  let payload: ReviewPayload;
  if (action === "REJECT") {
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
    payload = { action, rejectionReason: reason };
  } else {
    payload = { action };
  }

  try {
    const result = await callBackend<ReviewResponse>(
      `/api/v1/admin/subscription-requests/${encodeURIComponent(id)}/review`,
      { method: "POST", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
