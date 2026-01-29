import { NormalizedOCROutput, DocumentType } from '@/shared/types/ocr-system.types';

export function classifyDocumentType(normalizedOutput: NormalizedOCROutput): DocumentType {
  const text = normalizedOutput.pages.map(page => page.raw_text).join('\n');
  const textLower = text.toLowerCase();

  // Check for ID documents
  if (isIdDocument(textLower)) {
    return 'ID_DOCUMENT';
  }

  // Check for CV/Resume
  if (isCvResume(textLower)) {
    return 'CV_RESUME';
  }

  // Check for Invoice/Receipt
  if (isInvoiceReceipt(textLower)) {
    return 'INVOICE_RECEIPT';
  }

  // Check for Contract/Legal
  if (isContractLegal(textLower)) {
    return 'CONTRACT_LEGAL';
  }

  // Check for Form/Application
  if (isFormApplication(textLower)) {
    return 'FORM_APPLICATION';
  }

  // Check for Certificate/Diploma
  if (isCertificateDiploma(textLower)) {
    return 'CERTIFICATE_DIPLOMA';
  }

  // Check for Bank Statement
  if (isBankStatement(textLower)) {
    return 'BANK_STATEMENT';
  }

  // Check for Medical Document
  if (isMedicalDocument(textLower)) {
    return 'MEDICAL_DOCUMENT';
  }

  // Default to generic document
  return 'GENERIC_DOCUMENT';
}

function isIdDocument(text: string): boolean {
  const idIndicators = [
    'passport',
    'id card',
    'identification',
    'driver\'s license',
    'national id',
    'date of birth',
    'date of issue',
    'date of expiry',
    'issuing authority'
  ];

  const idPattern = new RegExp(idIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(idPattern);

  // Need at least 3 ID-related terms to be confident
  return matches ? matches.length >= 3 : false;
}

function isCvResume(text: string): boolean {
  const cvIndicators = [
    'curriculum vitae',
    'resume',
    'cv',
    'education',
    'experience',
    'skills',
    'work history',
    'professional summary',
    'contact information',
    'references'
  ];

  const cvPattern = new RegExp(cvIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(cvPattern);

  // Need at least 2 CV-related terms
  const hasEmail = !!text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const hasPhone = !!text.match(/(\+?\d{1,3}[- .]?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4})|(\d{3}[- .]?\d{3}[- .]?\d{4})/);

  return (matches ? matches.length >= 2 : false) || (hasEmail && hasPhone);
}

function isInvoiceReceipt(text: string): boolean {
  const invoiceIndicators = [
    'invoice',
    'receipt',
    'bill',
    'total',
    'subtotal',
    'tax',
    'amount due',
    'invoice number',
    'invoice no',
    'vendor',
    'customer',
    'payment terms',
    'due date'
  ];

  const invoicePattern = new RegExp(invoiceIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(invoicePattern);

  // Need at least 3 invoice-related terms
  const hasCurrency = !!text.match(/\$\d+\.\d{2}|€\d+\.\d{2}|£\d+\.\d{2}/);

  return (matches ? matches.length >= 3 : false) || hasCurrency;
}

function isContractLegal(text: string): boolean {
  const contractIndicators = [
    'contract',
    'agreement',
    'terms and conditions',
    'legal',
    'parties',
    'effective date',
    'termination',
    'clause',
    'whereas',
    'signatures',
    'obligations',
    'confidentiality'
  ];

  const contractPattern = new RegExp(contractIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(contractPattern);

  // Need at least 3 contract-related terms
  return matches ? matches.length >= 3 : false;
}

function isFormApplication(text: string): boolean {
  const formIndicators = [
    'application form',
    'form',
    'application',
    'please fill',
    'required fields',
    'signature',
    'date',
    'applicant',
    'submit',
    'section'
  ];

  const formPattern = new RegExp(formIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(formPattern);

  // Need at least 2 form-related terms
  const hasFields = text.includes(':') || text.includes('_____') || text.includes('......');

  return (matches ? matches.length >= 2 : false) || hasFields;
}

function isCertificateDiploma(text: string): boolean {
  const certificateIndicators = [
    'certificate',
    'diploma',
    'degree',
    'awarded to',
    'this certifies',
    'recipient',
    'in recognition',
    'completion',
    'graduation',
    'institution'
  ];

  const certificatePattern = new RegExp(certificateIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(certificatePattern);

  // Need at least 2 certificate-related terms
  return matches ? matches.length >= 2 : false;
}

function isBankStatement(text: string): boolean {
  const bankIndicators = [
    'bank statement',
    'account statement',
    'transaction history',
    'account number',
    'iban',
    'bic',
    'swift',
    'deposit',
    'withdrawal',
    'balance',
    'bank name'
  ];

  const bankPattern = new RegExp(bankIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(bankPattern);

  // Need at least 3 bank-related terms
  const hasAccountNumber = !!text.match(/\b\d{8,16}\b/);
  const hasCurrency = !!text.match(/\$\d+\.\d{2}|€\d+\.\d{2}|£\d+\.\d{2}/);

  return (matches ? matches.length >= 3 : false) || (hasAccountNumber && hasCurrency);
}

function isMedicalDocument(text: string): boolean {
  const medicalIndicators = [
    'patient',
    'medical',
    'diagnosis',
    'treatment',
    'prescription',
    'doctor',
    'physician',
    'hospital',
    'clinic',
    'symptoms',
    'medication',
    'procedure'
  ];

  const medicalPattern = new RegExp(medicalIndicators.map(indicator => `\\b${indicator}\\b`).join('|'), 'i');
  const matches = text.match(medicalPattern);

  // Need at least 3 medical-related terms
  return matches ? matches.length >= 3 : false;
}