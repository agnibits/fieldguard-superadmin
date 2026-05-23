// GET /api/companies/:id — fetch a single company's details.
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { CompanyResponse } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await callBackend<CompanyResponse>(
      `/api/v1/admin/companies/${encodeURIComponent(id)}`,
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
