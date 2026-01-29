import { MistralOCRResponse, NormalizedOCROutput, OCRPage, OCRBlock, BoundingBox } from '@/shared/types/ocr-system.types';

export function normalizeMistralOutput(response: MistralOCRResponse): NormalizedOCROutput {
  const pages: OCRPage[] = [];
  let hasTables = false;
  let hasImages = false;
  let detectedLanguage: string | undefined;

  // Process each page from Mistral OCR response
  for (const [pageIndex, mistralPage] of response.pages.entries()) {
    const pageNumber = pageIndex + 1;
    const blocks: OCRBlock[] = [];
    let rawText = '';

    // Parse markdown content to extract blocks and layout information
    // This is a simplified parser - in production, use a proper markdown parser
    const lines = mistralPage.markdown.split('\n');
    let currentY = 0;
    const lineHeight = 20;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Simple block detection based on markdown syntax
      let blockType: OCRBlock['type'] = 'paragraph';
      let text = line;

      // Detect headings
      if (line.startsWith('# ')) {
        blockType = 'heading';
        text = line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        blockType = 'heading';
        text = line.substring(3).trim();
      } else if (line.startsWith('### ')) {
        blockType = 'heading';
        text = line.substring(4).trim();
      }
      // Detect list items
      else if (line.match(/^[-*+]\s/)) {
        blockType = 'list_item';
        text = line.substring(2).trim();
      }
      // Detect tables (simplified)
      else if (line.includes('|')) {
        hasTables = true;
        // Skip table parsing for now - handled in document model
        continue;
      }

      // Create bounding box (simplified - real implementation would use actual coordinates)
      const bbox: BoundingBox = {
        x1: 50,
        y1: currentY,
        x2: 800,
        y2: currentY + lineHeight
      };

      // Calculate confidence (simplified - real implementation would use OCR confidence scores)
      const confidence = calculateConfidence(text);

      blocks.push({
        text,
        bbox,
        confidence,
        page: pageNumber,
        type: blockType
      });

      rawText += text + '\n';
      currentY += lineHeight;
    }

    // Detect language from text (simplified)
    if (!detectedLanguage) {
      detectedLanguage = detectLanguage(rawText);
    }

    pages.push({
      page_number: pageNumber,
      width: 850, // Standard A4 width in pixels
      height: 1100, // Standard A4 height in pixels
      blocks,
      raw_text: rawText.trim()
    });

    currentY += 50; // Add spacing between pages
  }

  return {
    pages,
    total_pages: pages.length,
    language: detectedLanguage,
    has_tables: hasTables,
    has_images: hasImages
  };
}

function calculateConfidence(text: string): number {
  // Simplified confidence calculation
  // In production, this would use actual OCR confidence scores
  const lengthFactor = Math.min(1, text.length / 50);
  const wordFactor = text.split(' ').length > 1 ? 0.9 : 0.7;
  return Math.min(0.95, 0.7 + lengthFactor * 0.2 + wordFactor * 0.1);
}

function detectLanguage(text: string): string {
  // Simplified language detection
  // In production, use a proper language detection library
  const commonEnglishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'it'];
  const textLower = text.toLowerCase();
  
  let englishWordCount = 0;
  for (const word of commonEnglishWords) {
    if (textLower.includes(word)) {
      englishWordCount++;
    }
  }

  if (englishWordCount >= 3) {
    return 'en';
  }

  // Check for other common languages
  if (text.match(/[\u4e00-\u9fff]/)) return 'zh'; // Chinese
  if (text.match(/[\u0600-\u06FF]/)) return 'ar'; // Arabic
  if (text.match(/[\u0400-\u04FF]/)) return 'ru'; // Russian

  return 'unknown';
}