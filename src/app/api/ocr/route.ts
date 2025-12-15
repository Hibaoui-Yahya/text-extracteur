/**
 * OCR API Route
 * Handles file upload and text extraction using Mistral OCR API
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage, extractTextFromPdfWithOCR } from "@/lib/mistral";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";

// Increase body size limit for file uploads
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_PDF_TYPE = "application/pdf";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Mistral OCR limit)

interface OCRResponse {
    success: boolean;
    text?: string;
    error?: string;
    pageCount?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<OCRResponse>> {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        // Validate file presence
        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 50MB limit" },
                { status: 400 }
            );
        }

        // Validate file type
        const fileType = file.type;
        const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
        const isPdf = fileType === ALLOWED_PDF_TYPE;

        if (!isImage && !isPdf) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unsupported file type: ${fileType}. Allowed: PDF, PNG, JPG, WEBP`,
                },
                { status: 400 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        // Process based on file type using Mistral OCR API
        if (isImage) {
            const result = await extractTextFromImage(base64, fileType);

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                text: result.text,
                pageCount: 1,
            });
        } else {
            // PDF processing using Mistral OCR API
            const result = await extractTextFromPdfWithOCR(base64);

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                text: result.text,
                pageCount: (result as { pageCount?: number }).pageCount || 1,
            });
        }
    } catch (error) {
        console.error("OCR API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            { status: 500 }
        );
    }
}
