// Re-export the OCR API route from features
import { NextRequest, NextResponse } from "next/server";
import ocrRoute from '@/features/ocr/api/route';

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  return ocrRoute.POST(request);
}