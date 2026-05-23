// GET /api/companies?status=... — list companies, optionally filtered by status.
import { NextRequest } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { ApprovalStatus, CompaniesResponse } from "@/lib/types";

const VALID: ApprovalStatus[] = ["PENDING_APPROVAL", "APPROVED", "REJECTED"];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  // Only forward a status filter the backend understands; otherwise list all.
  const query =
    status && VALID.includes(status as ApprovalStatus)
      ? `?status=${status}`
      : "";

  try {
    const result = await callBackend<CompaniesResponse>(
      `/api/v1/admin/companies${query}`,
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
