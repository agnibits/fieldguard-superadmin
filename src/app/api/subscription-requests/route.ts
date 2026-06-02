// GET /api/subscription-requests?status=PENDING|APPROVED|REJECTED (optional)
// Lists subscription verification requests. Omit ?status= for all.
import { NextRequest } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type {
  SubscriptionRequestsResponse,
  SubscriptionRequestStatus,
} from "@/lib/types";

const VALID: SubscriptionRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const query =
    status && VALID.includes(status as SubscriptionRequestStatus)
      ? `?status=${status}`
      : "";

  try {
    const result = await callBackend<SubscriptionRequestsResponse>(
      `/api/v1/admin/subscription-requests${query}`,
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
