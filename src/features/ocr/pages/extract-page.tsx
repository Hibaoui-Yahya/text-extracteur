"use client";

import { useState, useRef } from "react";
import { DocumentUpload, Copy } from "iconsax-react";
import { validateFile } from "@/core/utils/file-validation";
import { ExtractHeader } from "@/shared/ui/extract-header";
import { OCRSystemResponse } from "@/shared/types/ocr-system.types";

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (validation.isValid) {
        setFile(selectedFile);
        setError("");
        setExtractedText("");
      } else {
        setError(validation.error || "Invalid file");
      }
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsLoading(true);
    setError("");
    setExtractedText("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OCRSystemResponse = await response.json();
      setExtractedText(result.plain_text);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to process document");
      console.error("OCR processing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setExtractedText("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text:", err);
          setError("Failed to copy text to clipboard");
        });
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    return <DocumentUpload size={32} color="#35AEF3" variant="Bold" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ExtractHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Text Extracteur</h1>
          <p className="text-gray-400">Extract text from any document using AI-powered OCR</p>
        </div>

        {/* Upload Section */}
        <section className="mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              cursor-pointer rounded-xl border-2 border-dashed p-8 text-center
              ${file ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600 bg-gray-900/50"}
              transition-all duration-200
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800">
                  {getFileIcon()}
                </div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm underline mt-2"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800">
                  <DocumentUpload size={24} color="#6b7280" variant="Bold" />
                </div>
                <p className="text-gray-300">Drop your document here or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports PDF, PNG, JPG, WEBP • Max 20MB
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Extract Button */}
        <section className="mb-6">
          <button
            onClick={handleExtract}
            disabled={!file || isLoading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium
              ${file && !isLoading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
              transition-colors duration-200
            `}
          >
            {isLoading ? "Processing..." : "Extract Text"}
          </button>
        </section>

        {/* Results Section - Simple Text Display */}
        {extractedText && (
          <section className="mt-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Extracted Text</h3>
                <button
                  onClick={handleCopyText}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                  <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-64 p-3 bg-gray-800 border border-gray-700 rounded-md text-sm font-mono text-white resize-y"
                  spellCheck={false}
                />
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-500">
                    {extractedText.length} characters
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-sm text-gray-600">
          <p>Powered by ConqrOCR • Your data is processed in-memory and never stored</p>
        </footer>
      </main>
    </div>
  );
}