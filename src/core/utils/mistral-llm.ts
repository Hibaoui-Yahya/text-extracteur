import { MistralOCRResponse } from '@/shared/types/ocr-system.types';

const MISTRAL_CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_TEXT_MODEL = "mistral-large-latest";

const STRICT_EXTRACTION_SYSTEM_PROMPT = `You are DocExtract Pro operating in STRICT EXTRACTION MODE.

Rules:
- Use ONLY provided OCR text.
- Never invent, infer, enrich, or normalize content.
- If information is missing or unclear, return null.
- Preserve original wording, casing, punctuation exactly.
- Formatting is true/false ONLY if explicitly available, else "unknown".
- Never hallucinate styles, dates, or numbers.
- Attach evidence for each extracted field with source text and confidence.

Output MUST be valid JSON matching the exact schema.`;

export async function callMistralLLM(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("Mistral API key is not configured");
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
            content: STRICT_EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1, // Very low temperature for deterministic output
        max_tokens: 4096,
        response_format: { type: "json_object" }, // Force JSON response
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

      throw new Error(`Mistral API error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Failed to get content from Mistral API");
    }

    return content;
  } catch (error) {
    throw new Error(`Mistral LLM call failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Fallback function for when LLM is not available
// This provides basic extraction without AI
export function fallbackExtraction(ocrText: string): string {
  // Simple key-value extraction using regex patterns
  const result: any = {
    extraction: {},
    evidence: [],
    unmapped_fields: []
  };

  // Extract potential names
  const nameMatches = ocrText.match(/name[:\s]*(.+)/i);
  if (nameMatches) {
    result.extraction.full_name = nameMatches[1].trim();
    result.evidence.push({
      field: 'full_name',
      value: nameMatches[1].trim(),
      source_text: nameMatches[0],
      confidence: 0.7
    });
  }

  // Extract potential dates
  const dateMatches = ocrText.match(/date[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i);
  if (dateMatches) {
    result.extraction.date = dateMatches[1];
    result.evidence.push({
      field: 'date',
      value: dateMatches[1],
      source_text: dateMatches[0],
      confidence: 0.6
    });
  }

  // Extract potential numbers
  const numberMatches = ocrText.match(/number[:\s]*([A-Z0-9\-]+)/i);
  if (numberMatches) {
    result.extraction.document_number = numberMatches[1];
    result.evidence.push({
      field: 'document_number',
      value: numberMatches[1],
      source_text: numberMatches[0],
      confidence: 0.65
    });
  }

  // Extract emails
  const emailMatches = ocrText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatches) {
    result.extraction.email = emailMatches[0];
    result.evidence.push({
      field: 'email',
      value: emailMatches[0],
      source_text: emailMatches[0],
      confidence: 0.8
    });
  }

  // Extract amounts
  const amountMatches = ocrText.match(/total[:\s]*[\$€£]?\s*(\d+\.\d{2})/i);
  if (amountMatches) {
    result.extraction.total = parseFloat(amountMatches[1]);
    result.evidence.push({
      field: 'total',
      value: parseFloat(amountMatches[1]),
      source_text: amountMatches[0],
      confidence: 0.85
    });
  }

  return JSON.stringify(result);
}