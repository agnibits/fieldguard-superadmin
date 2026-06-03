// GET /api/enterprise-inquiries?status=PENDING|CONTACTED|CLOSED  (optional)
// Lists enterprise call-request leads. Omit ?status= for all.
import { NextRequest } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { EnterpriseInquiriesResponse, InquiryStatus } from "@/lib/types";

const VALID: InquiryStatus[] = ["PENDING", "CONTACTED", "CLOSED"];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const query =
    status && VALID.includes(status as InquiryStatus) ? `?status=${status}` : "";

  try {
    const result = await callBackend<EnterpriseInquiriesResponse>(
      `/api/v1/admin/enterprise-inquiries${query}`,
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
