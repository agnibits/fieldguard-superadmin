// Client-side API helper. Components ONLY ever call our own /api/* proxy routes,
// never the backend directly. The session token lives in an httpOnly cookie and
// is attached server-side, so it is never visible to this code.
"use client";

import type {
  Admin,
  ApprovalPayload,
  ApprovalStatus,
  Company,
  CompaniesResponse,
} from "./types";

/** Error carrying the human-readable message + status from a proxy response. */
export class ApiError extends Error {
  status: number;
  fieldErrors?: { field: string; message: string }[];

  constructor(message: string, status: number, fieldErrors?: { field: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  // A 401 from our proxy means the session is gone — send the user to /login.
  if (res.status === 401 && typeof window !== "undefined") {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message as string)) || res.statusText || "Request failed.";
    throw new ApiError(message, res.status, data?.errors);
  }

  return data as T;
}

export const api = {
  login(email: string, password: string): Promise<{ admin: Admin }> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout(): Promise<{ success: true }> {
    return request("/api/auth/logout", { method: "POST" });
  },

  me(): Promise<{ admin: Admin }> {
    return request("/api/auth/me");
  },

  companies(status?: ApprovalStatus | "ALL"): Promise<CompaniesResponse> {
    const qs = status && status !== "ALL" ? `?status=${status}` : "";
    return request(`/api/companies${qs}`);
  },

  company(id: number | string): Promise<{ company: Company }> {
    return request(`/api/companies/${id}`);
  },

  setApproval(id: number | string, payload: ApprovalPayload): Promise<{ company: Company }> {
    return request(`/api/companies/${id}/approval`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Permanently delete a non-approved company. The backend will refuse if the
   * company is APPROVED or has shops/tasks attached — those errors surface as
   * an ApiError with the backend's human-readable message.
   */
  deleteCompany(id: number | string): Promise<{ success: true; message?: string }> {
    return request(`/api/companies/${id}`, { method: "DELETE" });
  },
};
