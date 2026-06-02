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
  PaymentSettingResponse,
  ReviewPayload,
  ReviewResponse,
  SetSubscriptionPayload,
  SetSubscriptionResponse,
  SubscriptionRequestsResponse,
  SubscriptionRequestStatus,
  UploadUrlResponse,
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

  // --- Payment QR settings (Section A) ---------------------------------------

  paymentSetting(): Promise<PaymentSettingResponse> {
    return request("/api/payment-setting");
  },

  paymentUploadUrl(ext: string, mimeType: string): Promise<UploadUrlResponse> {
    const qs = new URLSearchParams({ ext, mimeType }).toString();
    return request(`/api/payment-setting/upload-url?${qs}`);
  },

  updatePaymentSetting(body: {
    qrImageKey?: string;
    paymentNote?: string;
  }): Promise<PaymentSettingResponse> {
    return request("/api/payment-setting", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /**
   * Direct PUT of the file bytes to S3 using a presigned URL from
   * paymentUploadUrl(). This goes browser → S3, NOT through our proxy.
   * S3 will reject the request if the Content-Type header doesn't match the
   * one baked into the presigned URL, so we set it explicitly.
   */
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new ApiError(
        `Upload failed (${res.status}). Please try again.`,
        res.status
      );
    }
  },

  // --- Subscription verification (Sections B + C) ----------------------------

  subscriptionRequests(
    status?: SubscriptionRequestStatus | "ALL"
  ): Promise<SubscriptionRequestsResponse> {
    const qs = status && status !== "ALL" ? `?status=${status}` : "";
    return request(`/api/subscription-requests${qs}`);
  },

  reviewSubscriptionRequest(
    id: number | string,
    payload: ReviewPayload
  ): Promise<ReviewResponse> {
    return request(`/api/subscription-requests/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --- Manual subscription override (Section D) ------------------------------

  setSubscription(
    companyId: number | string,
    payload: SetSubscriptionPayload
  ): Promise<SetSubscriptionResponse> {
    return request(`/api/companies/${companyId}/subscription`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
