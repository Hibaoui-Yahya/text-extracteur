// OCR System Types - Strict extraction with evidence tracking

export type DocumentType =
  | 'ID_DOCUMENT'
  | 'CV_RESUME'
  | 'INVOICE_RECEIPT'
  | 'CONTRACT_LEGAL'
  | 'FORM_APPLICATION'
  | 'CERTIFICATE_DIPLOMA'
  | 'BANK_STATEMENT'
  | 'MEDICAL_DOCUMENT'
  | 'GENERIC_DOCUMENT';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface OCRBlock {
  text: string;
  bbox: BoundingBox;
  confidence: number;
  page: number;
  type: 'heading' | 'paragraph' | 'list_item' | 'table' | 'key_value' | 'unknown';
}

export interface OCRTable {
  rows: OCRTableRow[];
  bbox: BoundingBox;
  page: number;
}

export interface OCRTableRow {
  cells: OCRTableCell[];
}

export interface OCRTableCell {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface OCRPage {
  page_number: number;
  width: number;
  height: number;
  blocks: OCRBlock[];
  tables?: OCRTable[];
  raw_text: string;
}

export interface EvidenceItem {
  field: string;
  value: any;
  source_text: string;
  confidence: number;
  bbox?: BoundingBox;
  page?: number;
}

export interface QualityAssessment {
  overall_confidence: number;
  needs_review: boolean;
  warnings: string[];
}

export interface DocumentModel {
  pages: DocumentPage[];
  reading_order: DocumentElement[];
  formatting: FormattingInfo;
}

export interface DocumentPage {
  page_number: number;
  elements: DocumentElement[];
  dimensions: {
    width: number;
    height: number;
  };
}

export interface DocumentElement {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'list_item' | 'table' | 'key_value' | 'image';
  content: string | DocumentTable | DocumentKeyValue | string[];
  bbox: BoundingBox;
  page: number;
  style?: {
    bold?: boolean | 'unknown';
    italic?: boolean | 'unknown';
    underline?: boolean | 'unknown';
  };
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
  bbox: BoundingBox;
}

export interface DocumentKeyValue {
  key: string;
  value: string;
}

export interface FormattingInfo {
  has_bold: boolean | 'unknown';
  has_italic: boolean | 'unknown';
  has_underline: boolean | 'unknown';
  has_tables: boolean;
  has_lists: boolean;
  multi_column: boolean | 'unknown';
}

export interface StructuredExtraction {
  // ID_DOCUMENT fields
  document_number?: string | null;
  full_name?: string | null;
  date_of_birth?: string | null;
  date_of_issue?: string | null;
  date_of_expiry?: string | null;
  issuing_authority?: string | null;
  
  // CV_RESUME fields
  candidate?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  education?: Array<{
    institution?: string | null;
    degree?: string | null;
    year?: string | null;
  }>;
  experience?: Array<{
    company?: string | null;
    position?: string | null;
    duration?: string | null;
  }>;
  skills?: string[] | null;
  
  // INVOICE_RECEIPT fields
  invoice_number?: string | null;
  date?: string | null;
  vendor?: string | null;
  customer?: string | null;
  items?: Array<{
    description?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    total?: number | null;
  }>;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  
  // CONTRACT_LEGAL fields
  title?: string | null;
  parties?: string[] | null;
  effective_date?: string | null;
  termination_date?: string | null;
  clauses?: string[] | null;
  
  // FORM_APPLICATION fields
  form_title?: string | null;
  applicant?: {
    name?: string | null;
    address?: string | null;
    contact?: string | null;
  };
  fields?: Array<{
    label?: string | null;
    value?: string | null;
  }>;
  
  // CERTIFICATE_DIPLOMA fields
  recipient_name?: string | null;
  certificate_title?: string | null;
  issuing_institution?: string | null;
  date_issued?: string | null;
  
  // BANK_STATEMENT fields
  bank_name?: string | null;
  account_number?: string | null;
  iban?: string | null;
  period?: string | null;
  transactions?: Array<{
    date?: string | null;
    description?: string | null;
    amount?: number | null;
    balance?: number | null;
  }>;
  
  // MEDICAL_DOCUMENT fields
  patient_name?: string | null;
  provider?: string | null;
  date?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  
  // GENERIC_DOCUMENT fields
  content?: string | null;
}

export interface OCRSystemResponse {
  request_id: string;
  plain_text: string;
  doc_type: DocumentType;
  extraction: StructuredExtraction;
  doc_model: DocumentModel;
  evidence: EvidenceItem[];
  unmapped_fields: string[];
  quality: QualityAssessment;
  processing_time_ms: number;
}

export interface OCRInput {
  file_buffer: Buffer;
  mime_type: string;
  file_size: number;
  original_filename: string;
}

export interface MistralOCRResponse {
  pages: Array<{
    index: number;
    markdown: string;
    images?: Array<{
      id: string;
      image_base64?: string;
    }>;
  }>;
  model: string;
  usage_info?: {
    pages_processed: number;
    doc_size_bytes: number;
  };
}

export interface NormalizedOCROutput {
  pages: OCRPage[];
  total_pages: number;
  language?: string;
  has_tables: boolean;
  has_images: boolean;
}