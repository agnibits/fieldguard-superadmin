// Domain types shared by the proxy route handlers and client components.

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type Plan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";

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

  // Subscription fields — backend includes these on list and detail responses.
  // May be absent on older payloads, so all are optional.
  subscriptionPlan?: Plan;
  subscriptionExpiresAt?: string | null;
  seatLimit?: number | null;

  // SMS kill-switch + monthly usage. Manual block wins over any plan rule;
  // each plan auto-blocks at its own quota (FREE 50 / STARTER 300 / GROWTH 900),
  // ENTERPRISE is unlimited.
  smsBlocked?: boolean;
  smsBlockReason?: string | null;
  smsUsage?: SmsUsage;
}

export interface SmsUsage {
  month: string; // e.g. "2026-06" — Nepal month boundary
  used: number;
  /** null when plan is unlimited (ENTERPRISE). */
  quota: number | null;
  /** null when plan is unlimited. */
  remaining: number | null;
  unlimited: boolean;
  /** True when used >= quota. For FREE this also means SMS is blocked. */
  overQuota: boolean;
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
  /** Current billing month in "YYYY-MM" form. All smsUsage rows align to this. */
  smsMonth?: string;
  companies: Company[];
}

export interface CompanyResponse {
  company: Company;
  /** Backend also returns smsUsage at the top level on the detail endpoint. */
  smsUsage?: SmsUsage;
}

// --- SMS kill-switch (block / resume) ----------------------------------------

export type SmsBlockPayload =
  | { blocked: true; reason?: string }
  | { blocked: false };

export interface SmsBlockResponse {
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

// --- Payment QR settings (Section A) -----------------------------------------

export interface PaymentSetting {
  qrImageUrl: string | null;
  paymentNote: string | null;
}

export interface PaymentSettingResponse {
  payment: PaymentSetting | null;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
}

// --- Subscription verification queue (Sections B + C) ------------------------

export type SubscriptionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SubscriptionRequest {
  id: number;
  company: { id: number; name: string; uniqueId: string };
  requestedBy: { id: number; name: string; phone: string };
  plan: Plan;
  months: number;
  amountNpr: number;
  paymentProof: string; // image URL
  status: SubscriptionRequestStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SubscriptionRequestsResponse {
  count: number;
  requests: SubscriptionRequest[];
}

export type ReviewPayload =
  | { action: "APPROVE" }
  | { action: "REJECT"; rejectionReason: string };

export interface Subscription {
  id: number;
  companyId: number;
  plan: Plan;
  expiresAt: string | null;
  seatLimit: number | null;
}

export interface ReviewResponse {
  request: SubscriptionRequest;
  subscription?: Subscription; // present on APPROVE
}

// --- Manual subscription override (Section D) --------------------------------

export type SetSubscriptionPayload =
  | { plan: "FREE" }
  | { plan: "STARTER"; months: number }
  | { plan: "GROWTH"; months: number }
  | { plan: "ENTERPRISE"; seatLimit?: number | null; months?: number };

export interface SetSubscriptionResponse {
  company: Company;
  subscription: Subscription;
}

// --- Enterprise call-request inquiries ---------------------------------------

export type InquiryStatus = "PENDING" | "CONTACTED" | "CLOSED";

export interface EnterpriseInquiry {
  id: number;
  companyId: number;
  company: { id: number; name: string; uniqueId: string };
  requestedBy: { id: number; name: string; phone: string };
  contactPhone: string;
  expectedStaffCount: number;
  message: string;
  status: InquiryStatus;
  adminNote: string | null;
  handledBy: { id: number; name?: string } | number | null;
  handledAt: string | null;
  createdAt: string;
}

export interface EnterpriseInquiriesResponse {
  count: number;
  inquiries: EnterpriseInquiry[];
}

// Backend only accepts CONTACTED or CLOSED here (PENDING is the initial state
// and can't be set via this endpoint).
export interface InquiryStatusPayload {
  status: "CONTACTED" | "CLOSED";
  note?: string;
}

export interface InquiryResponse {
  inquiry: EnterpriseInquiry;
}
