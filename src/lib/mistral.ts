/**
 * Mistral AI OCR Helper
 * Uses the official Mistral OCR API endpoint (/v1/ocr)
 */

const MISTRAL_OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";
const MISTRAL_TEXT_MODEL = "mistral-large-latest";
const MISTRAL_CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

const TEXT_STRUCTURE_PROMPT = `You are a text formatting assistant.

Take the raw extracted text and format it into clean, readable Markdown.

────────────────────────────────────
RULES
────────────────────────────────────
1. NEVER add information that is not present
2. NEVER remove any information
3. NEVER summarize or rewrite content
4. Preserve the original language
5. Do not add code blocks around the output

────────────────────────────────────
FORMATTING GUIDELINES
────────────────────────────────────
• Use ## for main section headings
• Use bullet points for lists
• Preserve tables with proper markdown table format
• Separate sections with blank lines
• Keep contact info, dates, and numbers exactly as written

Output only the formatted text, no explanations.`;

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

interface OCRPage {
    index: number;
    markdown: string;
    images?: Array<{
        id: string;
        image_base64?: string;
    }>;
}

interface OCRAPIResponse {
    pages: OCRPage[];
    model: string;
    usage_info?: {
        pages_processed: number;
        doc_size_bytes: number;
    };
}

/**
 * Extract text from a base64-encoded image using Mistral OCR API
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
        const response = await fetch(MISTRAL_OCR_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "mistral-ocr-latest",
                document: {
                    type: "image_url",
                    image_url: `data:${mimeType};base64,${imageBase64}`,
                },
            }),
        });

        if (!response.ok) {
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
                error: `Mistral OCR API error: ${response.status} - ${errorMessage}`,
            };
        }

        const data: OCRAPIResponse = await response.json();

        // Combine all pages' markdown content
        const extractedText = data.pages
            .map(page => page.markdown)
            .join("\n\n---\n\n");

        if (!extractedText || extractedText.trim().length === 0) {
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
 * Extract text from a PDF using Mistral OCR API
 */
export async function extractTextFromPdfWithOCR(
    pdfBase64: string
): Promise<MistralOCRResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: "Mistral API key is not configured",
        };
    }

    try {
        const response = await fetch(MISTRAL_OCR_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "mistral-ocr-latest",
                document: {
                    type: "document_url",
                    document_url: `data:application/pdf;base64,${pdfBase64}`,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error?.message || errorText;
            } catch {
                // Keep errorText as is
            }

            return {
                success: false,
                error: `Mistral OCR API error: ${response.status} - ${errorMessage}`,
            };
        }

        const data: OCRAPIResponse = await response.json();

        // Combine all pages' markdown content
        const extractedText = data.pages
            .map(page => page.markdown)
            .join("\n\n---\n\n");

        if (!extractedText || extractedText.trim().length === 0) {
            return {
                success: false,
                error: "No text extracted from the PDF",
            };
        }

        return {
            success: true,
            text: cleanMarkdownOutput(extractedText),
            pageCount: data.pages.length,
        } as MistralOCRResponse & { pageCount?: number };
    } catch (error) {
        return {
            success: false,
            error: `Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Structure raw text using Mistral AI (for text-based PDFs)
 */
export async function structureText(rawText: string): Promise<MistralOCRResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: "Mistral API key is not configured",
        };
    }

    try {
        const response = await fetch(MISTRAL_CHAT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MISTRAL_TEXT_MODEL,
                messages: [
                    {
                        role: "system",
                        content: TEXT_STRUCTURE_PROMPT,
                    },
                    {
                        role: "user",
                        content: rawText,
                    },
                ],
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error?.message || errorText;
            } catch {
                // Keep errorText as is
            }

            return {
                success: false,
                error: `Mistral API error: ${response.status} - ${errorMessage}`,
            };
        }

        const data = await response.json();
        const structuredText = data.choices?.[0]?.message?.content;

        if (!structuredText) {
            return {
                success: false,
                error: "Failed to structure the text",
            };
        }

        return {
            success: true,
            text: cleanMarkdownOutput(structuredText),
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to structure text: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Extract text from multiple images (for multi-page scanned documents)
 */
export async function extractTextFromMultipleImages(
    images: Array<{ base64: string; mimeType: string }>
): Promise<MistralOCRResponse> {
    const results: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const result = await extractTextFromImage(images[i].base64, images[i].mimeType);
        if (result.success && result.text) {
            results.push(result.text);
        } else if (!result.success) {
            return {
                success: false,
                error: `Failed to process page ${i + 1}: ${result.error}`,
            };
        }
    }

    return {
        success: true,
        text: results.join("\n\n---\n\n"),
    };
}
