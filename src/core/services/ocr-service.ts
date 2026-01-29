import { v4 as uuidv4 } from 'uuid';
import { OCRSystemResponse, OCRInput, MistralOCRResponse, NormalizedOCROutput, DocumentType } from '@/shared/types/ocr-system.types';
import { extractTextFromImage, extractTextFromPdfWithOCR } from './mistral.service';
import { validateFile } from '@/core/utils/file-validation';
import { classifyDocumentType } from '@/core/utils/document-classifier';
import { buildDocumentModel } from '@/core/utils/document-model-builder';
import { performStructuredExtraction } from '@/core/utils/structured-extractor';
import { assessQuality } from '@/core/utils/quality-assessor';
import { normalizeMistralOutput } from '@/core/utils/ocr-normalizer';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  throw new Error('Mistral API key is not configured');
}

export class OCRService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];

  public static async processDocument(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string
  ): Promise<OCRSystemResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Validate input
    const validation = this.validateInput(fileBuffer, mimeType);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid input');
    }

    let mistralResponse: MistralOCRResponse;
    let tempFilePath: string | null = null;

    try {
      // Stage A: Call Mistral OCR API
      const ocrInput: OCRInput = {
        file_buffer: fileBuffer,
        mime_type: mimeType,
        file_size: fileBuffer.length,
        original_filename: originalFilename
      };

      mistralResponse = await this.callMistralOCR(ocrInput);

      // Stage B: Normalize OCR output
      const normalizedOutput = normalizeMistralOutput(mistralResponse);

      // Stage C: Classify document type
      const docType = classifyDocumentType(normalizedOutput);

      // Stage D: Perform structured extraction
      const { extraction, evidence, unmappedFields } = await performStructuredExtraction(
        normalizedOutput,
        docType
      );

      // Stage E: Build document model
      const docModel = buildDocumentModel(normalizedOutput);

      // Stage F: Assess quality
      const quality = assessQuality(extraction, evidence, docType);

      // Stage G: Compile final response
      const processingTime = Date.now() - startTime;

      const response: OCRSystemResponse = {
        request_id: requestId,
        plain_text: this.extractPlainText(normalizedOutput),
        doc_type: docType,
        extraction,
        doc_model: docModel,
        evidence,
        unmapped_fields: unmappedFields,
        quality,
        processing_time_ms: processingTime
      };

      return response;
    } finally {
      // Ensure no temporary files remain
      if (tempFilePath) {
        try {
          // In a real implementation, we would delete the temp file here
          // For this in-memory implementation, we don't create temp files
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
      }
    }
  }

  private static validateInput(fileBuffer: Buffer, mimeType: string): { isValid: boolean; error?: string } {
    // Check file size
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${mimeType}. Allowed: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private static async callMistralOCR(input: OCRInput): Promise<MistralOCRResponse> {
    const { file_buffer, mime_type } = input;
    const base64 = file_buffer.toString('base64');

    try {
      if (mime_type === 'application/pdf') {
        const result = await extractTextFromPdfWithOCR(base64);
        if (!result.success) {
          throw new Error(result.error || 'Mistral OCR API error');
        }
        if (!result.text) {
          throw new Error('No text returned from OCR service');
        }
        return JSON.parse(result.text) as MistralOCRResponse;
      } else {
        const result = await extractTextFromImage(base64, mime_type);
        if (!result.success) {
          throw new Error(result.error || 'Mistral OCR API error');
        }
        if (!result.text) {
          throw new Error('No text returned from OCR service');
        }
        return JSON.parse(result.text) as MistralOCRResponse;
      }
    } catch (error) {
      throw new Error(`Mistral OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractPlainText(normalizedOutput: NormalizedOCROutput): string {
    return normalizedOutput.pages.map(page => page.raw_text).join('\n\n');
  }

  // Helper method for testing
  public static getAllowedMimeTypes(): string[] {
    return this.ALLOWED_MIME_TYPES;
  }

  public static getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }
}