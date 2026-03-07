/**
 * Mistral AI OCR Helper
 * Uses the official Mistral OCR API endpoint (/v1/ocr)
 */

const MISTRAL_OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";
const MISTRAL_TEXT_MODEL = "mistral-large-latest";
const MISTRAL_CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_OCR_MODEL = "mistral-ocr-2512"; // Latest OCR model

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
        // Use fallback extraction when API key is not available
        console.warn("Mistral API key not configured, using fallback extraction");
        return {
            success: true,
            text: JSON.stringify(createFallbackMistralResponse()),
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
                model: "mistral-ocr-2512",
                document: {
                    type: "image_url",
                    image_url: `data:${mimeType};base64,${imageBase64}`,
                },
                include_image_base64: false,
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
            text: JSON.stringify({
                pages: data.pages,
                model: data.model,
                usage_info: data.usage_info,
            }),
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
                model: "mistral-ocr-2512",
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
            text: JSON.stringify({
                pages: data.pages,
                model: data.model,
                usage_info: data.usage_info,
            }),
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
        // Use fallback extraction when API key is not available
        console.warn("Mistral API key not configured, using fallback extraction");
        return {
            success: true,
            text: JSON.stringify(createFallbackMistralResponse()),
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

/**
 * Vision-based verification: sends the original image + OCR text to a vision model
 * to correct OCR errors (wrong chars, broken tables, missing text).
 * Only used for images — PDFs go through OCR natively and are already high quality.
 */
export async function verifyWithVision(
    imageBase64: string,
    mimeType: string,
    ocrMarkdown: string
): Promise<string> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return ocrMarkdown;

    try {
        const response = await fetch(MISTRAL_CHAT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "pixtral-large-latest",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `You are a text-only transcription tool. Read the image and output ONLY the actual printed/written text. Nothing else.

WHAT TO DO:
- Read every word visible in the image
- Output them preserving the original layout and reading order
- For bilingual text (e.g. French + Arabic on same line), write both on the same line separated by " / "
- Use a markdown table ONLY if the document itself is a table or form with clear field-value pairs
- Arabic: write in Arabic script, preserve diacritics if visible
- French: preserve accents (é, è, ç, à)
- Numbers/dates/IDs: copy exactly as printed

WHAT TO NEVER DO:
- NEVER describe what you see (no "Stamp Text:", "Flags/Symbols:", "Other visible text:", "bottom left:", etc.)
- NEVER add bullet points listing field names separately from their values
- NEVER mention colors, positions, photos, logos, flags, or visual elements
- NEVER add section headers like "Header:", "Body:", "Footer:" that don't exist in the document
- NEVER add explanatory text or commentary
- NEVER use bullet points (●) to list text — just write the text naturally
- NEVER wrap output in code blocks
- NEVER include image references like ![img](...)
- NEVER output anything that is not actual readable text in the image

EXAMPLE — for a Moroccan ID card, output like this:
ROYAUME DU MAROC / المملكة المغربية
CARTE NATIONALE D'IDENTITE / البطاقة الوطنية للتعريف

EL ALAMI / العلمي
ZAINEB / زينب
Née le 05/12/1983 / مزدادة بتاريخ
à OUARZAZATE / ب ورزازات
U1234567
Valable jusqu'au 22/07/2029 / صالحة إلى غاية

NOT like this (WRONG):
❌ "Stamp Text (bottom left): ..."
❌ "Flags/Symbols: ● Moroccan flag"
❌ "Other visible text: ● الاسم الشخصي"

OCR STARTING POINT (use only as reference, may be wrong/incomplete):
${ocrMarkdown}

Now output ONLY the text from the image. No descriptions. No commentary. Just text.`,
                            },
                            {
                                type: "image_url",
                                image_url: `data:${mimeType};base64,${imageBase64}`,
                            },
                        ],
                    },
                ],
                max_tokens: 16384,
            }),
        });

        if (!response.ok) {
            console.warn("Vision verification failed, using original OCR output");
            return ocrMarkdown;
        }

        const data = await response.json();
        const corrected = data.choices?.[0]?.message?.content;

        if (!corrected || corrected.trim().length === 0) {
            return ocrMarkdown;
        }

        return cleanMarkdownOutput(corrected);
    } catch (error) {
        console.warn("Vision verification error:", error);
        return ocrMarkdown;
    }
}

/**
 * Create a fallback Mistral OCR response when API is not available
 */
function createFallbackMistralResponse(): MistralOCRResponse {
    return {
        success: true,
        text: JSON.stringify({
            pages: [
                {
                    index: 0,
                    markdown: "# Document Content\n\nThis is a fallback response. The Mistral OCR API is not configured or available.\n\nPlease configure your Mistral API key in the .env file to enable full OCR functionality.",
                }
            ],
            model: "fallback-ocr",
        }),
    };
}
