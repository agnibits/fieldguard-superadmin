// POST /api/companies/:id/subscription
// Manually set a company's plan (for comps / Enterprise deals / fixes).
//
// Payloads (validated below):
//   { plan: "FREE" }                                  // fresh 1-month trial
//   { plan: "STARTER", months: 3 }                    // months required
//   { plan: "GROWTH",  months: 6 }                    // months required
//   { plan: "ENTERPRISE", seatLimit: 25 }             // both optional
//   { plan: "ENTERPRISE", seatLimit: 50, months: 12 }
//
// On expiry the backend LOCKS the account (no new staff, SMS paused) until
// resubscribed — the modal copy makes this clear before submit.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { SetSubscriptionPayload, SetSubscriptionResponse } from "@/lib/types";

const VALID_PLANS = ["FREE", "STARTER", "GROWTH", "ENTERPRISE"] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

function isValidPlan(p: unknown): p is ValidPlan {
  return typeof p === "string" && (VALID_PLANS as readonly string[]).includes(p);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    plan?: unknown;
    months?: unknown;
    seatLimit?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (!isValidPlan(body.plan)) {
    return NextResponse.json(
      { message: "Plan must be FREE, STARTER, GROWTH, or ENTERPRISE." },
      { status: 400 }
    );
  }
  const plan = body.plan;

  let payload: SetSubscriptionPayload;

  if (plan === "FREE") {
    payload = { plan };
  } else if (plan === "STARTER" || plan === "GROWTH") {
    const months = Number(body.months);
    if (!Number.isInteger(months) || months < 1) {
      return NextResponse.json(
        {
          message: `Months is required for ${plan} and must be a positive integer.`,
          errors: [{ field: "months", message: "Must be a positive integer." }],
        },
        { status: 400 }
      );
    }
    payload = { plan, months };
  } else {
    // ENTERPRISE: both seatLimit and months are optional, but if provided they
    // must be valid. seatLimit null/omit = unlimited.
    const out: SetSubscriptionPayload = { plan: "ENTERPRISE" };

    if (body.seatLimit !== undefined && body.seatLimit !== null) {
      const sl = Number(body.seatLimit);
      if (!Number.isInteger(sl) || sl < 1) {
        return NextResponse.json(
          {
            message: "Seat limit must be a positive integer (or omit for unlimited).",
            errors: [{ field: "seatLimit", message: "Must be a positive integer." }],
          },
          { status: 400 }
        );
      }
      out.seatLimit = sl;
    }

    if (body.months !== undefined && body.months !== null) {
      const m = Number(body.months);
      if (!Number.isInteger(m) || m < 1) {
        return NextResponse.json(
          {
            message: "Months must be a positive integer.",
            errors: [{ field: "months", message: "Must be a positive integer." }],
          },
          { status: 400 }
        );
      }
      out.months = m;
    }

    payload = out;
  }

  try {
    const result = await callBackend<SetSubscriptionResponse>(
      `/api/v1/admin/companies/${encodeURIComponent(id)}/subscription`,
      { method: "POST", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
