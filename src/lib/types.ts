// Domain types shared by the proxy route handlers and client components.

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Company {
  id: number;
  uniqueId: string; // e.g. "CMP_001"
  name: string;
  email: string | null;
  phone: string | null;
  panNumber: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  citizenshipImage: string | null; // image URL (may be null if not uploaded)
  registrationDocument: string | null; // image URL (may be null if not uploaded)
  createdAt: string; // ISO date
}

export interface Admin {
  id: number;
  email: string;
  fullName: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: Admin;
}

export interface MeResponse {
  admin: Admin;
}

export interface CompaniesResponse {
  count: number;
  companies: Company[];
}

export interface CompanyResponse {
  company: Company;
}

// Shape of an error payload returned by the backend.
export interface BackendError {
  success: false;
  statusCode: number;
  message: string;
  errors?: { field: string; message: string }[];
  timestamp: string;
  path: string;
}

// Action payloads accepted by POST /companies/:id/approval.
export type ApprovalPayload =
  | { status: "APPROVED" }
  | { status: "PENDING_APPROVAL" }
  | { status: "REJECTED"; rejectionReason: string };
