// GET /api/auth/me — returns the current admin profile, used to validate the session.
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { MeResponse } from "@/lib/types";

export async function GET() {
  try {
    const result = await callBackend<MeResponse>("/api/v1/admin/me", { auth: true });
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
