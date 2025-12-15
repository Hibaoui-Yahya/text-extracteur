/**
 * PDF Text Extractor
 * Extracts text from PDFs using unpdf (Mozilla's pdf.js for Node)
 */

import { extractText, getDocumentProxy } from "unpdf";

export interface PDFExtractionResult {
    text: string;
    pageCount: number;
    isScanned: boolean;
}

/**
 * Extract text from PDF using unpdf
 * Returns the text content and whether it appears to be a scanned document
 */
export async function extractTextFromPdf(
    pdfBuffer: Buffer
): Promise<PDFExtractionResult> {
    try {
        const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
        const { text, totalPages } = await extractText(pdf, { mergePages: true });

        // Handle both string and array return types
        let extractedText: string;
        if (typeof text === "string") {
            extractedText = text;
        } else if (Array.isArray(text)) {
            extractedText = (text as string[]).join("\n\n");
        } else {
            extractedText = String(text || "");
        }
        const pageCount = totalPages || 1;

        // Check if PDF appears to be scanned (very little extractable text)
        // A typical CV has at least 100 characters per page
        const textDensity = extractedText.trim().length / pageCount;
        const isScanned = textDensity < 50;

        return {
            text: extractedText.trim(),
            pageCount,
            isScanned,
        };
    } catch (error) {
        throw new Error(
            `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

/**
 * Check if PDF processing is available
 */
export async function checkPdfSupport(): Promise<boolean> {
    return true;
}
