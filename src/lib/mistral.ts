/**
 * Mistral AI OCR Helper
 * Handles image-to-text extraction using Pixtral vision model
 */

const MISTRAL_API_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "pixtral-12b-2409";
const MISTRAL_TEXT_MODEL = "mistral-large-latest";

const OCR_PROMPT = `You are a professional document extraction engine.

The input is a document page or document content (image or text).
The document can be ANY type:
CV, resume, invoice, contract, form, report, letter, receipt, table, or mixed-language document.

YOUR GOAL:
Return the document content in a clean, readable, well-structured format
WITHOUT changing, summarizing, or inventing any content.

────────────────────────────────────
CORE RULES (ABSOLUTE – DO NOT VIOLATE)
────────────────────────────────────
1. NEVER add information that is not explicitly present
2. NEVER remove any information that is present
3. NEVER summarize, rewrite, rephrase, or correct text
4. NEVER translate content
5. NEVER explain what you are doing
6. NEVER label the output (no "Extracted Text", no metadata)

If text is unclear or ambiguous, keep it exactly as visible.

────────────────────────────────────
EXTRACTION BEHAVIOR
────────────────────────────────────
• If the document contains readable text (digital PDF or text layer):
  - Preserve wording exactly
  - Restore logical structure (line breaks, sections, lists)

• If the document is scanned or image-based:
  - Perform OCR
  - Preserve reading order and visible structure
  - Do NOT infer layout semantics

────────────────────────────────────
STRUCTURE & FORMATTING RULES
────────────────────────────────────
• Preserve original language(s) and characters
• Preserve case, punctuation, symbols, and spacing
• Preserve paragraph separation
• Preserve headings and section titles as they appear
• Preserve bullet points and numbered lists
• Preserve tables:
  - Keep rows and columns aligned
  - Keep headers
• Preserve forms and key-value layouts
• Preserve dates, ranges, currencies, units
• Preserve headers, footers, page numbers, stamps, and signatures if visible

Use clean, minimal Markdown:
- Headings only if they clearly exist
- Lists only where bullets/numbers exist
- Tables only where tables exist

DO NOT beautify or normalize aggressively.

────────────────────────────────────
FINAL OUTPUT REQUIREMENTS
────────────────────────────────────
• Output ONLY the document content
• Clean Markdown
• No code blocks
• No commentary
• No added titles
• No emojis

Before responding, verify:
- Nothing added
- Nothing removed
- Nothing rewritten`;

const TEXT_STRUCTURE_PROMPT = `You are a professional document formatter.

The input is raw extracted text from a document (CV, invoice, contract, form, report, etc.).
The text may have lost its original structure during extraction.

YOUR GOAL:
Restore the document to a clean, readable, well-structured Markdown format
WITHOUT changing any content.

────────────────────────────────────
CORE RULES (ABSOLUTE – DO NOT VIOLATE)
────────────────────────────────────
1. NEVER add information that is not in the text
2. NEVER remove any information
3. NEVER summarize, rewrite, or rephrase
4. NEVER translate content
5. NEVER explain what you are doing
6. NEVER add labels like "Extracted Text" or metadata

────────────────────────────────────
STRUCTURE RESTORATION RULES
────────────────────────────────────
• Identify and format section headings (use ## for main sections)
• Separate distinct sections with blank lines
• Format contact information clearly (name, email, phone, address, links)
• Format dates and date ranges consistently
• Create bullet lists where multiple items are listed
• Preserve the original language
• Preserve all text exactly as written

────────────────────────────────────
FOR CVs/RESUMES SPECIFICALLY
────────────────────────────────────
Structure typically includes:
- Name and contact info at top
- Professional summary/objective
- Work experience (company, title, dates, description)
- Education (institution, degree, dates)
- Skills (technical, languages, etc.)
- Projects, certifications, languages, interests

────────────────────────────────────
OUTPUT REQUIREMENTS
────────────────────────────────────
• Clean Markdown only
• No code blocks
• No commentary
• No added content

Restore the logical structure now:`;

/**
 * Clean markdown output by removing code block wrappers
 */
function cleanMarkdownOutput(text: string): string {
    let cleaned = text.trim();

    // Remove opening markdown code block
    cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n?/i, '');

    // Remove closing code block
    cleaned = cleaned.replace(/\n?```\s*$/i, '');

    return cleaned.trim();
}

export interface MistralOCRResponse {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Extract text from a base64-encoded image using Mistral Pixtral OCR
 */
export async function extractTextFromImage(
    imageBase64: string,
    mimeType: string
): Promise<MistralOCRResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: "Mistral API key is not configured",
        };
    }

    try {
        const response = await fetch(MISTRAL_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MISTRAL_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: OCR_PROMPT,
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            // Try to get error as text first, then parse as JSON if possible
            const errorText = await response.text();
            let errorMessage = errorText;

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error?.message || errorText;
            } catch {
                // Keep errorText as is if not valid JSON
            }

            return {
                success: false,
                error: `Mistral API error: ${response.status} - ${errorMessage}`,
            };
        }

        const data = await response.json();
        const extractedText = data.choices?.[0]?.message?.content;

        if (!extractedText) {
            return {
                success: false,
                error: "No text extracted from the image",
            };
        }

        return {
            success: true,
            text: cleanMarkdownOutput(extractedText),
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Structure raw text using Mistral AI
 */
export async function structureText(
    rawText: string
): Promise<MistralOCRResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        return {
            success: true,
            text: rawText, // Return original if no API key
        };
    }

    try {
        const response = await fetch(MISTRAL_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MISTRAL_TEXT_MODEL,
                messages: [
                    {
                        role: "user",
                        content: `${TEXT_STRUCTURE_PROMPT}\n\n${rawText}`,
                    },
                ],
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            return {
                success: true,
                text: rawText, // Return original on error
            };
        }

        const data = await response.json();
        const structuredText = data.choices?.[0]?.message?.content;

        return {
            success: true,
            text: cleanMarkdownOutput(structuredText || rawText),
        };
    } catch {
        return {
            success: true,
            text: rawText, // Return original on error
        };
    }
}

/**
 * Process multiple images (e.g., PDF pages) and concatenate results
 */
export async function extractTextFromMultipleImages(
    images: Array<{ base64: string; mimeType: string }>
): Promise<MistralOCRResponse> {
    const results: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const { base64, mimeType } = images[i];
        const result = await extractTextFromImage(base64, mimeType);

        if (!result.success) {
            return {
                success: false,
                error: `Failed to process page ${i + 1}: ${result.error}`,
            };
        }

        if (images.length > 1) {
            results.push(`## Page ${i + 1}\n\n${result.text}`);
        } else {
            results.push(result.text || "");
        }
    }

    return {
        success: true,
        text: results.join("\n\n"),
    };
}
