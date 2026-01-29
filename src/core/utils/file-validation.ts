import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/shared/constants/file-constants";
import { FileValidationResult } from "@/shared/types/ocr.types";

export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Unsupported file type. Allowed: PDF, PNG, JPG, WEBP"
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  return { isValid: true };
}

export function getFileTypeCategory(mimeType: string): 'pdf' | 'image' | 'unknown' {
  if (mimeType === "application/pdf") {
    return 'pdf';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'unknown';
}