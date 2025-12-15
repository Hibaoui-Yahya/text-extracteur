/**
 * OCR API Route
 * Handles file upload and text extraction using Mistral Pixtral
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage, structureText } from "@/lib/mistral";
import { extractTextFromPdf } from "@/lib/pdf-converter";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";

// Increase body size limit for file uploads
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_PDF_TYPE = "application/pdf";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
                { success: false, error: "File size exceeds 20MB limit" },
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
                    error: `Unsupported file type: ${fileType}. Allowed: PDF, PNG, JPG`,
                },
                { status: 400 }
            );
        }

        // Process file based on type
        if (isImage) {
            // Convert image to base64 and send to OCR
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");

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
            // PDF processing - extract text directly then structure it
            const arrayBuffer = await file.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);

            try {
                const pdfResult = await extractTextFromPdf(pdfBuffer);

                // If PDF has extractable text (not scanned)
                if (!pdfResult.isScanned && pdfResult.text.length > 0) {
                    // Structure the raw text using Mistral
                    const structuredResult = await structureText(pdfResult.text);

                    return NextResponse.json({
                        success: true,
                        text: structuredResult.text,
                        pageCount: pdfResult.pageCount,
                    });
                }

                // For scanned PDFs with no text, inform the user
                if (pdfResult.isScanned || pdfResult.text.length === 0) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: "This PDF appears to be scanned or contains no extractable text. Please upload images (PNG/JPG) of each page instead for OCR processing.",
                        },
                        { status: 400 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    text: pdfResult.text,
                    pageCount: pdfResult.pageCount,
                });
            } catch (error) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                    { status: 500 }
                );
            }
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
