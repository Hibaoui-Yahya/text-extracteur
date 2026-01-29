/**
 * OCR API Route - Complete Document AI System
 * Implements strict OCR with no data storage, evidence tracking, and quality assessment
 */

import { NextRequest, NextResponse } from "next/server";
import { OCRSystemResponse } from "@/shared/types/ocr-system.types";
import { OCRService } from "@/core/services/ocr-service";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";

// Increase body size limit for file uploads
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<OCRSystemResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { 
          request_id: "00000000-0000-0000-0000-000000000000",
          plain_text: "",
          doc_type: "GENERIC_DOCUMENT",
          extraction: {},
          doc_model: { pages: [], reading_order: [], formatting: {
            has_bold: "unknown",
            has_italic: "unknown",
            has_underline: "unknown",
            has_tables: false,
            has_lists: false,
            multi_column: "unknown"
          } },
          evidence: [],
          unmapped_fields: ["ERROR: No file uploaded"],
          quality: {
            overall_confidence: 0.0,
            needs_review: true,
            warnings: ["NO_FILE_UPLOADED"]
          },
          processing_time_ms: 0
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store',
            'CDN-Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    // Validate file size
    if (file.size > OCRService.getMaxFileSize()) {
      return NextResponse.json(
        { 
          request_id: "00000000-0000-0000-0000-000000000000",
          plain_text: "",
          doc_type: "GENERIC_DOCUMENT",
          extraction: {},
          doc_model: { pages: [], reading_order: [], formatting: {
            has_bold: "unknown",
            has_italic: "unknown",
            has_underline: "unknown",
            has_tables: false,
            has_lists: false,
            multi_column: "unknown"
          } },
          evidence: [],
          unmapped_fields: ["ERROR: File size exceeds limit"],
          quality: {
            overall_confidence: 0.0,
            needs_review: true,
            warnings: ["FILE_SIZE_EXCEEDED"]
          },
          processing_time_ms: 0
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store',
            'CDN-Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    // Validate file type
    const fileType = file.type;
    const allowedTypes = OCRService.getAllowedMimeTypes();

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { 
          request_id: "00000000-0000-0000-0000-000000000000",
          plain_text: "",
          doc_type: "GENERIC_DOCUMENT",
          extraction: {},
          doc_model: { pages: [], reading_order: [], formatting: {
            has_bold: "unknown",
            has_italic: "unknown",
            has_underline: "unknown",
            has_tables: false,
            has_lists: false,
            multi_column: "unknown"
          } },
          evidence: [],
          unmapped_fields: [`ERROR: Unsupported file type: ${fileType}`],
          quality: {
            overall_confidence: 0.0,
            needs_review: true,
            warnings: ["UNSUPPORTED_FILE_TYPE"]
          },
          processing_time_ms: 0
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store',
            'CDN-Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Process document using the complete OCR pipeline
    const ocrResponse = await OCRService.processDocument(
      fileBuffer,
      fileType,
      file.name
    );

    // Return response with strict no-cache headers
    return NextResponse.json(ocrResponse, {
      headers: {
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  } catch (error) {
    console.error("OCR API error:", error);

    // Return error response with proper structure
    return NextResponse.json(
      { 
        request_id: "00000000-0000-0000-0000-000000000000",
        plain_text: "",
        doc_type: "GENERIC_DOCUMENT",
        extraction: {},
        doc_model: { pages: [], reading_order: [], formatting: {
          has_bold: "unknown",
          has_italic: "unknown",
          has_underline: "unknown",
          has_tables: false,
          has_lists: false,
          multi_column: "unknown"
        } },
        evidence: [],
        unmapped_fields: [`ERROR: ${error instanceof Error ? error.message : "Unknown error"}`],
        quality: {
          overall_confidence: 0.0,
          needs_review: true,
          warnings: ["SERVER_ERROR"]
        },
        processing_time_ms: 0
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'CDN-Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}