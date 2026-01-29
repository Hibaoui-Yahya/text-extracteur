// Test data for OCR system
import { OCRSystemResponse, DocumentType } from '@/shared/types/ocr-system.types';

export function createTestOCRResponse(
  docType: DocumentType = 'GENERIC_DOCUMENT',
  withWarnings: boolean = false
): OCRSystemResponse {
  const baseResponse: OCRSystemResponse = {
    request_id: '123e4567-e89b-12d3-a456-426614174000',
    plain_text: 'This is a sample document text for testing purposes. It contains multiple lines and some structured information that can be extracted.',
    doc_type: docType,
    extraction: {},
    doc_model: {
      pages: [
        {
          page_number: 1,
          elements: [
            {
              id: 'elem_1',
              type: 'heading',
              content: 'Sample Document',
              bbox: { x1: 50, y1: 50, x2: 300, y2: 80 },
              page: 1,
              style: { bold: true }
            },
            {
              id: 'elem_2',
              type: 'paragraph',
              content: 'This is the first paragraph of the sample document.',
              bbox: { x1: 50, y1: 100, x2: 500, y2: 150 },
              page: 1
            },
            {
              id: 'elem_3',
              type: 'paragraph',
              content: 'This is the second paragraph with some important information.',
              bbox: { x1: 50, y1: 170, x2: 500, y2: 220 },
              page: 1
            }
          ],
          dimensions: { width: 850, height: 1100 }
        }
      ],
      reading_order: [
        { id: 'elem_1', type: 'heading', content: 'Sample Document', bbox: { x1: 50, y1: 50, x2: 300, y2: 80 }, page: 1, style: { bold: true } },
        { id: 'elem_2', type: 'paragraph', content: 'This is the first paragraph of the sample document.', bbox: { x1: 50, y1: 100, x2: 500, y2: 150 }, page: 1 },
        { id: 'elem_3', type: 'paragraph', content: 'This is the second paragraph with some important information.', bbox: { x1: 50, y1: 170, x2: 500, y2: 220 }, page: 1 }
      ],
      formatting: {
        has_bold: true,
        has_italic: 'unknown',
        has_underline: 'unknown',
        has_tables: false,
        has_lists: false,
        multi_column: 'unknown'
      }
    },
    evidence: [],
    unmapped_fields: [],
    quality: {
      overall_confidence: 0.85,
      needs_review: false,
      warnings: []
    },
    processing_time_ms: 1250
  };

  // Add document-specific extraction data
  switch (docType) {
    case 'ID_DOCUMENT':
      baseResponse.extraction = {
        full_name: 'John Doe',
        document_number: 'ABC123456',
        date_of_birth: '1985-05-15'
      };
      baseResponse.evidence = [
        {
          field: 'full_name',
          value: 'John Doe',
          source_text: 'Name: John Doe',
          confidence: 0.95,
          bbox: { x1: 100, y1: 200, x2: 250, y2: 220 },
          page: 1
        },
        {
          field: 'document_number',
          value: 'ABC123456',
          source_text: 'ID: ABC123456',
          confidence: 0.90,
          bbox: { x1: 100, y1: 250, x2: 250, y2: 270 },
          page: 1
        }
      ];
      break;

    case 'CV_RESUME':
      baseResponse.extraction = {
        candidate: {
          full_name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 123-4567'
        },
        education: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Computer Science',
            year: '2018'
          }
        ],
        experience: [
          {
            company: 'Tech Solutions Inc.',
            position: 'Software Engineer',
            duration: '2018 - Present'
          }
        ]
      };
      baseResponse.evidence = [
        {
          field: 'candidate.full_name',
          value: 'Jane Smith',
          source_text: 'Jane Smith',
          confidence: 0.92,
          page: 1
        },
        {
          field: 'candidate.email',
          value: 'jane.smith@example.com',
          source_text: 'jane.smith@example.com',
          confidence: 0.98,
          page: 1
        }
      ];
      break;

    case 'INVOICE_RECEIPT':
      baseResponse.extraction = {
        invoice_number: 'INV-2023-001',
        date: '2023-10-15',
        vendor: 'Office Supplies Co.',
        customer: 'Acme Corporation',
        total: 1250.50,
        items: [
          {
            description: 'Office Chairs',
            quantity: 5,
            unit_price: 150.00,
            total: 750.00
          },
          {
            description: 'Desk Lamps',
            quantity: 10,
            unit_price: 50.50,
            total: 505.00
          }
        ]
      };
      baseResponse.evidence = [
        {
          field: 'invoice_number',
          value: 'INV-2023-001',
          source_text: 'Invoice #: INV-2023-001',
          confidence: 0.97,
          page: 1
        },
        {
          field: 'total',
          value: 1250.50,
          source_text: 'Total: $1,250.50',
          confidence: 0.99,
          page: 1
        }
      ];
      break;

    case 'GENERIC_DOCUMENT':
    default:
      baseResponse.extraction = {
        content: baseResponse.plain_text
      };
      baseResponse.evidence = [
        {
          field: 'content',
          value: baseResponse.plain_text,
          source_text: baseResponse.plain_text,
          confidence: 0.85,
          page: 1
        }
      ];
  }

  // Add warnings if requested
  if (withWarnings) {
    baseResponse.quality.warnings = [
      'DOC_TYPE_UNCERTAIN',
      'LOW_CONFIDENCE:date_of_birth',
      'STYLE_UNKNOWN_MOSTLY'
    ];
    baseResponse.quality.needs_review = true;
    baseResponse.quality.overall_confidence = 0.65;
  }

  return baseResponse;
}

export function createTestMistralOCRResponse(): any {
  return {
    pages: [
      {
        index: 0,
        markdown: `# Sample Document\n\nThis is the first paragraph of the sample document.\n\nThis is the second paragraph with some important information.\n\n## Personal Details\n\n- Name: John Doe\n- ID: ABC123456\n- Date of Birth: 1985-05-15`
      }
    ],
    model: 'mistral-ocr-2512',
    usage_info: {
      pages_processed: 1,
      doc_size_bytes: 1024
    }
  };
}

export function createTestNormalizedOutput(): any {
  return {
    pages: [
      {
        page_number: 1,
        width: 850,
        height: 1100,
        blocks: [
          {
            text: 'Sample Document',
            bbox: { x1: 50, y1: 50, x2: 300, y2: 80 },
            confidence: 0.95,
            page: 1,
            type: 'heading'
          },
          {
            text: 'This is the first paragraph of the sample document.',
            bbox: { x1: 50, y1: 100, x2: 500, y2: 150 },
            confidence: 0.88,
            page: 1,
            type: 'paragraph'
          },
          {
            text: 'This is the second paragraph with some important information.',
            bbox: { x1: 50, y1: 170, x2: 500, y2: 220 },
            confidence: 0.87,
            page: 1,
            type: 'paragraph'
          },
          {
            text: 'Personal Details',
            bbox: { x1: 50, y1: 250, x2: 200, y2: 280 },
            confidence: 0.92,
            page: 1,
            type: 'heading'
          },
          {
            text: 'Name: John Doe',
            bbox: { x1: 50, y1: 300, x2: 200, y2: 320 },
            confidence: 0.94,
            page: 1,
            type: 'paragraph'
          }
        ],
        raw_text: 'Sample Document\n\nThis is the first paragraph of the sample document.\n\nThis is the second paragraph with some important information.\n\nPersonal Details\n\nName: John Doe'
      }
    ],
    total_pages: 1,
    language: 'en',
    has_tables: false,
    has_images: false
  };
}