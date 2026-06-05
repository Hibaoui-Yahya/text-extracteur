import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromImage,
  extractTextFromPdfWithOCR,
  verifyWithVision,
} from "@/core/services/mistral.service";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

function stripImageRefs(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ALLOWED_ORIGINS = [
  "https://conqrocr.com",
  "https://www.conqrocr.com",
  "https://app.conqrocr.com",
  "https://conqrocr-production.up.railway.app",
  "http://localhost:3000",
];

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
  };
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400, headers });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400, headers }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400, headers }
      );
    }

    const startTime = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const isImage = file.type !== "application/pdf";

    // Stage 1: OCR extraction
    let result;
    if (isImage) {
      result = await extractTextFromImage(base64, file.type);
    } else {
      result = await extractTextFromPdfWithOCR(base64);
    }

    if (!result.success || !result.text) {
      return NextResponse.json(
        { error: result.error || "OCR processing failed" },
        { status: 500, headers }
      );
    }

    // Parse OCR response into markdown
    const ocrData = JSON.parse(result.text);
    let markdown = ocrData.pages
      .map((page: { index: number; markdown: string }) => page.markdown)
      .join("\n\n---\n\n");

    // Strip image references
    markdown = stripImageRefs(markdown);

    // Stage 2: Vision verification (images only — PDFs are multi-page and too large for vision)
    let verified = false;
    if (isImage && markdown.trim().length > 0) {
      const corrected = await verifyWithVision(base64, file.type, markdown);
      if (corrected !== markdown) {
        markdown = stripImageRefs(corrected);
        verified = true;
      }
    }

    return NextResponse.json(
      {
        markdown,
        pages: ocrData.pages.length,
        processing_time_ms: Date.now() - startTime,
        verified,
      },
      { headers }
    );
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers }
    );
  }
}
