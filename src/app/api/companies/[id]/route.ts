// GET    /api/companies/:id — fetch a single company's details.
// DELETE /api/companies/:id — permanently delete a non-approved company (cleanup).
//
// The DELETE endpoint is destructive: it removes the company along with its admin
// user(s), refresh tokens, and pending document uploads. The backend enforces the
// safety rails (refuses APPROVED companies, and any with shops/tasks attached);
// the proxy just forwards and surfaces those errors with their original status.
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Backend responds with a confirmation envelope on success and the standard
    // error shape (with statusCode and a human message) on refusal — both are
    // already handled by forward().
    const result = await callBackend<{ success: true; message?: string }>(
      `/api/v1/admin/companies/${encodeURIComponent(id)}`,
      { method: "DELETE", auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
