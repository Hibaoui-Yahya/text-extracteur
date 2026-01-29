import { StructuredExtraction, QualityAssessment, EvidenceItem, DocumentType } from '@/shared/types/ocr-system.types';

export function assessQuality(
  extraction: StructuredExtraction,
  evidence: EvidenceItem[],
  docType: DocumentType
): QualityAssessment {
  const warnings: string[] = [];
  let overallConfidence = 0.8; // Default confidence

  // Check for document type uncertainty
  if (isDocumentTypeUncertain(extraction, docType)) {
    warnings.push('DOC_TYPE_UNCERTAIN');
    overallConfidence *= 0.8; // Reduce confidence
  }

  // Check for low confidence fields
  checkLowConfidenceFields(evidence, warnings);

  // Check for missing required fields
  checkMissingRequiredFields(extraction, docType, warnings);

  // Check for ambiguous matches
  checkAmbiguousMatches(evidence, warnings);

  // Check for table parsing issues
  if (hasTablesButNoTableData(extraction)) {
    warnings.push('TABLE_PARSE_UNCERTAIN');
  }

  // Check for multi-column layout uncertainty
  if (mightBeMultiColumn(extraction)) {
    warnings.push('MULTI_COLUMN_UNCERTAIN');
  }

  // Check for style detection uncertainty
  warnings.push('STYLE_UNKNOWN_MOSTLY'); // Most documents don't have clear style info

  // Check for multiple languages
  if (detectsMultipleLanguages(extraction)) {
    warnings.push('MULTI_LANGUAGE_DETECTED');
  }

  // Check for partial crop or blur
  if (appearsPartiallyCropped(extraction)) {
    warnings.push('PARTIAL_CROP_OR_BLUR');
  }

  // Calculate overall confidence based on warnings
  const warningPenalty = 1 - (warnings.length * 0.05); // 5% penalty per warning
  overallConfidence = Math.max(0.3, overallConfidence * warningPenalty);

  // Determine if review is needed
  const needsReview = warnings.length > 0 || overallConfidence < 0.7;

  return {
    overall_confidence: parseFloat(overallConfidence.toFixed(2)),
    needs_review: needsReview,
    warnings: [...new Set(warnings)] // Remove duplicates
  };
}

function isDocumentTypeUncertain(extraction: StructuredExtraction, docType: DocumentType): boolean {
  // Check if the extracted content matches the expected document type
  switch (docType) {
    case 'ID_DOCUMENT':
      return !extraction.document_number && !extraction.full_name && !extraction.date_of_birth;
    
    case 'CV_RESUME':
      return !extraction.candidate && !extraction.education && !extraction.experience;
    
    case 'INVOICE_RECEIPT':
      return !extraction.invoice_number && !extraction.total && !extraction.items;
    
    case 'CONTRACT_LEGAL':
      return !extraction.title && !extraction.parties && !extraction.clauses;
    
    case 'FORM_APPLICATION':
      return !extraction.form_title && !extraction.fields;
    
    case 'CERTIFICATE_DIPLOMA':
      return !extraction.recipient_name && !extraction.certificate_title;
    
    case 'BANK_STATEMENT':
      return !extraction.bank_name && !extraction.account_number && !extraction.transactions;
    
    case 'MEDICAL_DOCUMENT':
      return !extraction.patient_name && !extraction.provider && !extraction.diagnosis;
    
    case 'GENERIC_DOCUMENT':
      return false; // Generic documents are always certain
  }

  return false;
}

function checkLowConfidenceFields(evidence: EvidenceItem[], warnings: string[]) {
  for (const item of evidence) {
    if (item.confidence < 0.6) {
      warnings.push(`LOW_CONFIDENCE:${item.field}`);
    }
  }
}

function checkMissingRequiredFields(extraction: StructuredExtraction, docType: DocumentType, warnings: string[]) {
  // This is already handled in the structured extractor, but we'll add warnings here too
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
      if (!extraction.patient_name && !extraction.provider && !extraction.medical_date) {
        warnings.push('MISSING_REQUIRED:patient_name OR provider OR medical_date');
      }
      break;
    
    case 'GENERIC_DOCUMENT':
      if (!extraction.content) {
        warnings.push('MISSING_REQUIRED:content');
      }
      break;
  }
}

function checkAmbiguousMatches(evidence: EvidenceItem[], warnings: string[]) {
  // Check for fields that might have multiple possible interpretations
  const ambiguousFields = ['date', 'name', 'number', 'amount'];
  
  for (const item of evidence) {
    if (ambiguousFields.some(field => item.field.includes(field)) && 
        item.confidence < 0.75) {
      warnings.push(`AMBIGUOUS_MATCH:${item.field}`);
    }
  }
}

function hasTablesButNoTableData(extraction: StructuredExtraction): boolean {
  // Check if we detected tables but didn't extract table data
  // This would be more accurate with actual table detection
  return false; // Simplified for this implementation
}

function mightBeMultiColumn(extraction: StructuredExtraction): boolean {
  // Check if the document might have multi-column layout
  // This would be more accurate with layout analysis
  const text = JSON.stringify(extraction);
  return text.length > 2000; // Long documents are more likely to be multi-column
}

function detectsMultipleLanguages(extraction: StructuredExtraction): boolean {
  // Simplified language detection
  const text = JSON.stringify(extraction);
  
  // Check for mixed scripts
  const hasLatin = /[a-zA-Z]/.test(text);
  const hasCyrillic = /[\u0400-\u04FF]/.test(text);
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  // Count how many different scripts we have
  let scriptCount = 0;
  if (hasLatin) scriptCount++;
  if (hasCyrillic) scriptCount++;
  if (hasCJK) scriptCount++;
  if (hasArabic) scriptCount++;

  return scriptCount >= 2;
}

function appearsPartiallyCropped(extraction: StructuredExtraction): boolean {
  // Check for signs of partial cropping or blur
  const text = JSON.stringify(extraction);
  
  // Check for abrupt endings
  const endsWithPartialWord = text.length > 100 && 
    (text.endsWith('-') || text.endsWith('…') || !!text.match(/\w+$/));

  // Check for very short content
  const isVeryShort = text.length < 100;

  return endsWithPartialWord || isVeryShort;
}