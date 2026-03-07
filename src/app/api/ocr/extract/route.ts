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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
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
        { status: 500 }
      );
    }

    // Parse OCR response into markdown
    const ocrData = JSON.parse(result.text);
    let markdown = ocrData.pages
      .map((page: { index: number; markdown: string }) => page.markdown)
      .join("\n\n---\n\n");

    // Strip image references — Mistral OCR returns ![img](img-0.jpeg) etc.
    // that point to non-existent files. We only want text.
    markdown = markdown
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")    // ![alt](url)
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")    // ![alt][ref]
      .replace(/<img[^>]*>/gi, "")               // <img> tags
      .replace(/\n{3,}/g, "\n\n");               // clean up extra blank lines

    // Stage 2: Vision verification (images only)
    // Sends the original image + OCR output to a vision model to correct errors
    let verified = false;
    if (isImage && markdown.trim().length > 0) {
      const corrected = await verifyWithVision(base64, file.type, markdown);
      if (corrected !== markdown) {
        markdown = corrected;
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
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
