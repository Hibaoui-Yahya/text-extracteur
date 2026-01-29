import { NormalizedOCROutput, DocumentModel, DocumentPage, DocumentElement, DocumentTable, DocumentKeyValue, FormattingInfo, BoundingBox } from '@/shared/types/ocr-system.types';

export function buildDocumentModel(normalizedOutput: NormalizedOCROutput): DocumentModel {
  const pages: DocumentPage[] = [];
  const readingOrder: DocumentElement[] = [];
  let elementIdCounter = 0;

  // Process each page to build the document model
  for (const page of normalizedOutput.pages) {
    const pageElements: DocumentElement[] = [];

    // Group blocks by type and proximity to create higher-level elements
    const groupedElements = groupBlocksByType(page.blocks);

    // Process each grouped element
    for (const group of groupedElements) {
      const elementId = `elem_${elementIdCounter++}`;

      if (group.type === 'heading') {
        const headingElement: DocumentElement = {
          id: elementId,
          type: 'heading',
          content: group.text,
          bbox: group.bbox,
          page: page.page_number,
          style: detectStyle(group.text)
        };
        pageElements.push(headingElement);
        readingOrder.push(headingElement);
      }
      else if (group.type === 'paragraph') {
        const paragraphElement: DocumentElement = {
          id: elementId,
          type: 'paragraph',
          content: group.text,
          bbox: group.bbox,
          page: page.page_number,
          style: detectStyle(group.text)
        };
        pageElements.push(paragraphElement);
        readingOrder.push(paragraphElement);
      }
      else if (group.type === 'list_item') {
        // Group consecutive list items into lists
        const listElement: DocumentElement = {
          id: elementId,
          type: 'list_item',
          content: group.text,
          bbox: group.bbox,
          page: page.page_number
        };
        pageElements.push(listElement);
        readingOrder.push(listElement);
      }
      else if (group.type === 'table') {
        // In a real implementation, we would parse tables from the OCR output
        // For this simplified version, we'll create a basic table structure
        const tableElement: DocumentElement = {
          id: elementId,
          type: 'table',
          content: createBasicTableFromText(group.text),
          bbox: group.bbox,
          page: page.page_number
        };
        pageElements.push(tableElement);
        readingOrder.push(tableElement);
      }
      else if (group.type === 'key_value') {
        // Detect key-value pairs
        const keyValue = extractKeyValue(group.text);
        if (keyValue) {
          const keyValueElement: DocumentElement = {
            id: elementId,
            type: 'key_value',
            content: keyValue,
            bbox: group.bbox,
            page: page.page_number
          };
          pageElements.push(keyValueElement);
          readingOrder.push(keyValueElement);
        }
      }
    }

    pages.push({
      page_number: page.page_number,
      elements: pageElements,
      dimensions: {
        width: page.width,
        height: page.height
      }
    });
  }

  // Detect overall formatting information
  const formatting = detectFormatting(normalizedOutput);

  return {
    pages,
    reading_order: readingOrder,
    formatting
  };
}

interface BlockGroup {
  type: string;
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

function groupBlocksByType(blocks: any[]): BlockGroup[] {
  // Simple grouping - in production, use more sophisticated layout analysis
  return blocks.map(block => ({
    type: block.type,
    text: block.text,
    bbox: block.bbox,
    confidence: block.confidence
  }));
}

function detectStyle(text: string): { bold?: boolean | 'unknown'; italic?: boolean | 'unknown'; underline?: boolean | 'unknown' } {
  // Simplified style detection - in production, use actual OCR style information
  const style: any = {};

  // Detect potential bold text (all caps, longer words)
  if (text === text.toUpperCase() && text.length > 10) {
    style.bold = true;
  } else if (text.length > 20) {
    style.bold = 'unknown';
  }

  // Detect potential italic text (contains common italicized phrases)
  const italicPhrases = ['note:', 'important:', 'warning:', 'disclaimer:'];
  if (italicPhrases.some(phrase => text.toLowerCase().includes(phrase))) {
    style.italic = true;
  }

  // Underline detection would require actual OCR data
  style.underline = 'unknown';

  return style;
}

function createBasicTableFromText(text: string): DocumentTable {
  // Simplified table creation - in production, parse actual table structure
  const lines = text.split('\n');
  
  // Try to detect table structure
  const headers: string[] = [];
  const rows: string[][] = [];
  
  // Look for lines that might be headers (contain | characters)
  for (const line of lines) {
    if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 1) {
        if (headers.length === 0) {
          // First table line is likely headers
          headers.push(...cells);
        } else {
          rows.push(cells);
        }
      }
    }
  }

  // If no table structure detected, create a simple one
  if (headers.length === 0 && lines.length > 1) {
    headers.push('Item', 'Description');
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      rows.push([`Item ${i+1}`, lines[i]]);
    }
  }

  // Create a default bounding box
  const bbox: BoundingBox = { x1: 100, y1: 100, x2: 700, y2: 300 };

  return {
    headers,
    rows,
    bbox
  };
}

function extractKeyValue(text: string): DocumentKeyValue | null {
  // Detect common key-value patterns
  const patterns = [
    /^(.+?):\s*(.+)$/,        // Key: Value
    /^(.+?)\s+-\s+(.+)$/,    // Key - Value
    /^(.+?)\s+=\s+(.+)$/     // Key = Value
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        key: match[1].trim(),
        value: match[2].trim()
      };
    }
  }

  return null;
}

function detectFormatting(normalizedOutput: NormalizedOCROutput): FormattingInfo {
  let hasBold = false;
  let hasItalic = false;
  let hasUnderline = false;
  let hasTables = normalizedOutput.has_tables;
  let hasLists = false;
  let multiColumn = 'unknown';

  // Analyze text for formatting clues
  for (const page of normalizedOutput.pages) {
    for (const block of page.blocks) {
      // Detect potential bold text
      if (block.text === block.text.toUpperCase() && block.text.length > 5) {
        hasBold = true;
      }

      // Detect potential italic text
      if (block.text.includes('*') || block.text.includes('_')) {
        hasItalic = true;
      }

      // Detect lists
      if (block.type === 'list_item') {
        hasLists = true;
      }

      // Detect potential multi-column layout
      if (block.bbox && block.bbox.x2 < 400) {
        multiColumn = true;
      }
    }
  }

  // If we didn't find clear evidence, mark as unknown
  if (!hasBold && !hasItalic) {
    hasBold = 'unknown';
    hasItalic = 'unknown';
  }

  if (!hasUnderline) {
    hasUnderline = 'unknown';
  }

  if (multiColumn === 'unknown') {
    // Check if we have blocks on both sides of the page
    const leftBlocks = normalizedOutput.pages[0]?.blocks.filter(b => b.bbox?.x1 < 300);
    const rightBlocks = normalizedOutput.pages[0]?.blocks.filter(b => b.bbox?.x1 > 500);
    
    if (leftBlocks?.length > 2 && rightBlocks?.length > 2) {
      multiColumn = true;
    }
  }

  return {
    has_bold: hasBold,
    has_italic: hasItalic,
    has_underline: hasUnderline,
    has_tables: hasTables,
    has_lists: hasLists,
    multi_column: multiColumn
  };
}