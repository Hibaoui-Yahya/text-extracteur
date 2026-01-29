import { NormalizedOCROutput, DocumentType, StructuredExtraction, EvidenceItem } from '@/shared/types/ocr-system.types';
import { callMistralLLM } from './mistral-llm';

export async function performStructuredExtraction(
  normalizedOutput: NormalizedOCROutput,
  docType: DocumentType
): Promise<{
  extraction: StructuredExtraction;
  evidence: EvidenceItem[];
  unmappedFields: string[];
}> {
  // Extract plain text from all pages
  const ocrText = normalizedOutput.pages.map(page => page.raw_text).join('\n\n');

  // Create the strict extraction prompt
  const prompt = createStrictExtractionPrompt(ocrText, docType);

  try {
    // Call Mistral LLM with the strict prompt
    const llmResponse = await callMistralLLM(prompt);

    // Parse the LLM response
    const parsedResponse = parseLLMResponse(llmResponse);

    // Validate the response against the schema
    const validation = validateExtraction(parsedResponse, docType);

    if (!validation.isValid) {
      // If validation fails, return minimal extraction with warnings
      return createFallbackExtraction(ocrText, docType, validation.warnings);
    }

    return {
      extraction: parsedResponse.extraction,
      evidence: parsedResponse.evidence || [],
      unmappedFields: parsedResponse.unmapped_fields || []
    };
  } catch (error) {
    console.error('LLM extraction failed:', error);
    // Fallback to basic extraction if LLM call fails
    return createFallbackExtraction(ocrText, docType, ['LLM_EXTRACTION_FAILED']);
  }
}

function createStrictExtractionPrompt(ocrText: string, docType: DocumentType): string {
  return `You are DocExtract Pro operating in STRICT EXTRACTION MODE.

Rules:
- Use ONLY OCR_INPUT.
- Never invent or infer.
- Missing or unclear  null.
- Preserve original text exactly.
- Output JSON only.

Allowed doc types:
ID_DOCUMENT, CV_RESUME, INVOICE_RECEIPT, CONTRACT_LEGAL, FORM_APPLICATION,
CERTIFICATE_DIPLOMA, BANK_STATEMENT, MEDICAL_DOCUMENT, GENERIC_DOCUMENT

Return EXACT JSON structure:
{
  "doc_type": "...",
  "extraction": { ... },
  "doc_model": { ... },
  "evidence": [ ... ],
  "unmapped_fields": [ ... ],
  "quality": { ... }
}

Required fields (at least one):
- ID_DOCUMENT: document_number OR full_name
- CV_RESUME: candidate.full_name OR email OR phone
- INVOICE_RECEIPT: total OR invoice_number
- CONTRACT_LEGAL: title OR parties
- FORM_APPLICATION: form_title OR fields
- CERTIFICATE_DIPLOMA: recipient_name OR certificate_title
- BANK_STATEMENT: bank_name OR account_number OR iban
- MEDICAL_DOCUMENT: patient_name OR provider OR date
- GENERIC_DOCUMENT: any content

OCR_INPUT:
${ocrText}`;
}

function parseLLMResponse(response: string): {
  extraction: StructuredExtraction;
  evidence: EvidenceItem[];
  unmapped_fields: string[];
} {
  try {
    // Parse the JSON response from LLM
    const parsed = JSON.parse(response);

    // Extract the relevant parts
    return {
      extraction: parsed.extraction || {},
      evidence: parsed.evidence || [],
      unmapped_fields: parsed.unmapped_fields || []
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    throw new Error('INVALID_LLM_RESPONSE');
  }
}

function validateExtraction(
  extraction: StructuredExtraction,
  docType: DocumentType
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check required fields based on document type
  switch (docType) {
    case 'ID_DOCUMENT':
      if (!extraction.document_number && !extraction.full_name) {
        warnings.push('MISSING_REQUIRED:document_number OR full_name');
      }
      break;

    case 'CV_RESUME':
      const hasCandidateInfo = extraction.candidate?.full_name || 
                               extraction.candidate?.email || 
                               extraction.candidate?.phone;
      if (!hasCandidateInfo) {
        warnings.push('MISSING_REQUIRED:candidate info');
      }
      break;

    case 'INVOICE_RECEIPT':
      if (!extraction.total && !extraction.invoice_number) {
        warnings.push('MISSING_REQUIRED:total OR invoice_number');
      }
      break;

    case 'CONTRACT_LEGAL':
      if (!extraction.title && !extraction.parties) {
        warnings.push('MISSING_REQUIRED:title OR parties');
      }
      break;

    case 'FORM_APPLICATION':
      if (!extraction.form_title && !extraction.fields) {
        warnings.push('MISSING_REQUIRED:form_title OR fields');
      }
      break;

    case 'CERTIFICATE_DIPLOMA':
      if (!extraction.recipient_name && !extraction.certificate_title) {
        warnings.push('MISSING_REQUIRED:recipient_name OR certificate_title');
      }
      break;

    case 'BANK_STATEMENT':
      if (!extraction.bank_name && !extraction.account_number && !extraction.iban) {
        warnings.push('MISSING_REQUIRED:bank_name OR account_number OR iban');
      }
      break;

    case 'MEDICAL_DOCUMENT':
      if (!extraction.patient_name && !extraction.provider && !extraction.date) {
        warnings.push('MISSING_REQUIRED:patient_name OR provider OR date');
      }
      break;

    case 'GENERIC_DOCUMENT':
      if (!extraction.content) {
        warnings.push('MISSING_REQUIRED:content');
      }
      break;
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

function createFallbackExtraction(
  ocrText: string,
  docType: DocumentType,
  additionalWarnings: string[] = []
): {
  extraction: StructuredExtraction;
  evidence: EvidenceItem[];
  unmappedFields: string[];
} {
  // Create a minimal extraction based on document type
  const extraction: StructuredExtraction = {};
  const evidence: EvidenceItem[] = [];
  const unmappedFields: string[] = [];

  // Add basic content for all document types
  switch (docType) {
    case 'GENERIC_DOCUMENT':
      extraction.content = ocrText.substring(0, 500) + (ocrText.length > 500 ? '...' : '');
      evidence.push({
        field: 'content',
        value: extraction.content,
        source_text: ocrText.substring(0, 500),
        confidence: 0.8
      });
      break;

    case 'ID_DOCUMENT':
      // Try to extract name using simple patterns
      const nameMatch = ocrText.match(/name[:\s]*(.+)/i);
      if (nameMatch) {
        extraction.full_name = nameMatch[1].trim();
        evidence.push({
          field: 'full_name',
          value: extraction.full_name,
          source_text: nameMatch[0],
          confidence: 0.7
        });
      }
      break;

    case 'CV_RESUME':
      // Try to extract email and phone
      const emailMatch = ocrText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        extraction.candidate = { email: emailMatch[0] };
        evidence.push({
          field: 'candidate.email',
          value: emailMatch[0],
          source_text: emailMatch[0],
          confidence: 0.8
        });
      }
      break;

    case 'INVOICE_RECEIPT':
      // Try to extract total amount
      const totalMatch = ocrText.match(/total[:\s]*[\$€£]?\s*(\d+\.\d{2})/i);
      if (totalMatch) {
        extraction.total = parseFloat(totalMatch[1]);
        evidence.push({
          field: 'total',
          value: extraction.total,
          source_text: totalMatch[0],
          confidence: 0.85
        });
      }
      break;

    // Add other document types as needed
  }

  // Add warnings
  const warnings = ['FALLBACK_EXTRACTION_USED', ...additionalWarnings];

  // Add unmapped fields warning if we have warnings
  if (warnings.length > 0) {
    unmappedFields.push(`Warnings: ${warnings.join(', ')}`);
  }

  return { extraction, evidence, unmappedFields };
}