// GET /api/payment-setting — current platform QR + note (or null if not set yet).
// PUT /api/payment-setting — update qrImageKey and/or paymentNote. Both fields
// optional; backend accepts updating just the note without re-uploading the QR.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { PaymentSettingResponse } from "@/lib/types";

export async function GET() {
  try {
    const result = await callBackend<PaymentSettingResponse>(
      "/api/v1/admin/payment-setting",
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  let body: { qrImageKey?: string; paymentNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  // Build the payload from only the keys the admin actually supplied — sending
  // an explicit `null` would clobber the existing value, which we don't want.
  const payload: Record<string, string> = {};
  if (typeof body.qrImageKey === "string" && body.qrImageKey.length > 0) {
    payload.qrImageKey = body.qrImageKey;
  }
  if (typeof body.paymentNote === "string") {
    payload.paymentNote = body.paymentNote;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { message: "Provide a new QR image or payment note to update." },
      { status: 400 }
    );
  }

  try {
    const result = await callBackend<PaymentSettingResponse>(
      "/api/v1/admin/payment-setting",
      { method: "PUT", auth: true, body: payload }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
