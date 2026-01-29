export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
}

export interface MistralOCRResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface OCRPage {
  index: number;
  markdown: string;
  images?: Array<{
    id: string;
    image_base64?: string;
  }>;
}

export interface OCRAPIResponse {
  pages: OCRPage[];
  model: string;
  usage_info?: {
    pages_processed: number;
    doc_size_bytes: number;
  };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}