// GET /api/payment-setting/upload-url?ext=png&mimeType=image/png
// Returns a presigned S3 PUT URL. The browser then PUTs the file bytes directly
// to that URL with the correct Content-Type header — backend never proxies the
// image bytes.
import { NextRequest, NextResponse } from "next/server";
import { callBackend, forward, unauthenticatedResponse, Unauthenticated } from "@/lib/backend";
import type { UploadUrlResponse } from "@/lib/types";

// Defensive allowlist — S3 will reject anything that doesn't match its policy,
// but rejecting nonsense at the proxy gives a faster, clearer error.
const ALLOWED_EXTS = new Set(["png", "jpg", "jpeg", "webp"]);
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET(req: NextRequest) {
  const ext = (req.nextUrl.searchParams.get("ext") || "").toLowerCase();
  const mimeType = req.nextUrl.searchParams.get("mimeType") || "";

  if (!ALLOWED_EXTS.has(ext) || !ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { message: "Only PNG, JPEG, or WebP images are allowed." },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({ ext, mimeType }).toString();

  try {
    const result = await callBackend<UploadUrlResponse>(
      `/api/v1/admin/payment-setting/upload-url?${qs}`,
      { auth: true }
    );
    return forward(result);
  } catch (e) {
    if (e instanceof Unauthenticated) return unauthenticatedResponse();
    throw e;
  }
}
