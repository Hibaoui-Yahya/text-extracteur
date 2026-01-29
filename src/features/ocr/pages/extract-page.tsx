"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  DocumentUpload,
  DocumentText1,
  Gallery,
  CloseCircle,
  Copy,
  TickCircle,
} from "iconsax-react";
import { ALLOWED_FILE_TYPES } from "@/shared/constants/file-constants";
import { validateFile } from "@/core/utils/file-validation";
import { ExtractHeader } from "@/shared/ui/extract-header";

import { OCRSystemResponse } from "@/shared/types/ocr-system.types";
import { ResultsPanel } from "@/features/ocr/components/results-panel";

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResponse, setOcrResponse] = useState<OCRSystemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ALLOWED_FILE_TYPES;

  const validateFileWrapper = (selectedFile: File): boolean => {
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFileWrapper(selectedFile)) {
      setFile(selectedFile);
      setError("");
      setExtractedText("");
      setPageCount(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFileWrapper(droppedFile)) {
      setFile(droppedFile);
      setError("");
      setExtractedText("");
      setPageCount(0);
    }
  }, []);

  // Handle paste from clipboard (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if it's an image
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        setIsPasting(true);

        const blob = item.getAsFile();
        if (blob) {
          // Create a proper File object with a name
          const extension = item.type.split('/')[1] || 'png';
          const fileName = `pasted-image-${Date.now()}.${extension}`;
          const file = new File([blob], fileName, { type: item.type });

          if (validateFileWrapper(file)) {
            setFile(file);
            setError("");
            setExtractedText("");
            setPageCount(0);
          }
        }

        setIsPasting(false);
        break;
      }
    }
  }, []);

  // Listen for paste events globally
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleExtract = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsLoading(true);
    setError("");
    setOcrResponse(null);
    setShowResults(false);

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
      
      // Validate the response structure
      if (!result.request_id || !result.plain_text || !result.doc_type) {
        throw new Error("Invalid OCR response structure");
      }

      setOcrResponse(result);
      setShowResults(true);
    } catch (err) {
      setError(
        `Request failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (extractedText) {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyText = async () => {
    if (ocrResponse?.plain_text) {
      await navigator.clipboard.writeText(ocrResponse.plain_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyJson = async () => {
    if (ocrResponse) {
      await navigator.clipboard.writeText(JSON.stringify(ocrResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadText = () => {
    if (ocrResponse?.plain_text) {
      const blob = new Blob([ocrResponse.plain_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted-text-${ocrResponse.request_id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadJson = () => {
    if (ocrResponse) {
      const blob = new Blob([JSON.stringify(ocrResponse, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted-data-${ocrResponse.request_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    setFile(null);
    setExtractedText("");
    setError("");
    setPageCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type === "application/pdf") {
      return <DocumentText1 size={32} color="#f87171" variant="Bold" />;
    }
    return <Gallery size={32} color="#60a5fa" variant="Bold" />;
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        if (listType === 'ul') {
          elements.push(
            <ul key={key++} className="list-disc list-inside space-y-1 my-3 text-gray-300">
              {listItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          );
        } else {
          elements.push(
            <ol key={key++} className="list-decimal list-inside space-y-1 my-3 text-gray-300">
              {listItems.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Horizontal rule
      if (line.match(/^---+$/)) {
        flushList();
        elements.push(<hr key={key++} className="border-gray-700 my-6" />);
        continue;
      }

      // Check for REAL markdown table (must have separator row with dashes)
      // Format: | Header | Header |
      //         |--------|--------|
      //         | Cell   | Cell   |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        // Look ahead for separator row (contains dashes)
        const nextLine = lines[i + 1];
        const hasSeparator = nextLine && nextLine.match(/^\|[\s-:|]+\|$/);

        if (hasSeparator) {
          flushList();

          // Collect all table rows
          const tableRows: string[] = [line];
          let j = i + 1;
          while (j < lines.length && lines[j].includes('|') && lines[j].trim().startsWith('|')) {
            tableRows.push(lines[j]);
            j++;
          }
          i = j - 1; // Skip processed lines

          // Parse table - filter out separator rows
          const parsedRows = tableRows
            .filter(row => !row.match(/^\|[\s-:|]+\|$/)) // Filter separator rows
            .map(row =>
              row.split('|')
                .filter(cell => cell.trim() !== '')
                .map(cell => cell.trim())
            )
            .filter(row => row.length >= 2); // Must have at least 2 columns

          if (parsedRows.length >= 2) { // Must have header + at least 1 data row
            const headerRow = parsedRows[0];
            const bodyRows = parsedRows.slice(1);

            elements.push(
              <div key={key++} className="my-4 overflow-x-auto">
                <table className="w-full border-collapse border border-gray-600 text-sm">
                  <thead>
                    <tr className="bg-gray-800">
                      {headerRow.map((cell, cellIdx) => (
                        <th key={cellIdx} className="border border-gray-600 px-4 py-2 text-left text-white font-semibold">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/30'}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="border border-gray-600 px-4 py-2 text-gray-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }
        }
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-lg font-semibold text-white mt-6 mb-2">
            {line.slice(4)}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-gray-700">
            {line.slice(3)}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={key++} className="text-2xl font-bold text-white mt-6 mb-4">
            {line.slice(2)}
          </h1>
        );
        continue;
      }

      // Bullet list
      if (line.match(/^[-*]\s/)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(line.slice(2));
        continue;
      }

      // Numbered list
      if (line.match(/^\d+\.\s/)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(line.replace(/^\d+\.\s/, ''));
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();

      // Process inline formatting
      let content = line;
      // Bold
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');

      elements.push(
        <p
          key={key++}
          className="text-gray-300 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#35AEF3]/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#35AEF3]/10 via-transparent to-transparent"></div>
      </div>

      {/* Header */}
      <ExtractHeader />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with Logo */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="/Conqrai_logo.svg"
              alt="ConqrAI Logo"
              className="h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-3">
            Text Extracteur
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Extract text from any document using AI-powered OCR
          </p>
        </header>

        {/* Upload Section */}
        <section className="mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
              transition-all duration-300 ease-out
              ${isDragging
                ? "border-[#35AEF3] bg-[#35AEF3]/10 scale-[1.02]"
                : "border-gray-700 hover:border-gray-600 bg-gray-900/50 hover:bg-gray-900/70"
              }
              backdrop-blur-sm
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
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gray-800 border border-gray-700">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="text-white font-medium text-lg">{file.name}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-white text-sm underline underline-offset-4 transition-colors"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gray-800 border border-gray-700">
                  <DocumentUpload size={32} color="#6b7280" variant="Bold" />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">
                    Drop your document here or click to browse
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Or press <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-[#35AEF3]">Ctrl</kbd> + <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-[#35AEF3]">V</kbd> to paste an image
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Supports PDF, PNG, JPG • Max 20MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <CloseCircle size={20} color="#f87171" variant="Bold" className="shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isLoading && (
          <section className="mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-[#35AEF3]" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#35AEF3] rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Processing Document</h3>
                    <p className="text-gray-400 text-sm">Processing document</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#35AEF3] animate-pulse"></div>
                  <span className="text-sm text-gray-400">In progress...</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 text-green-400">
                    <TickCircle className="w-3 h-3" />
                    <span>Upload Complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>OCR Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                    <span>Structuring Data</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Extract Button */}
        <section className="mb-8">
          <button
            onClick={handleExtract}
            disabled={!file || isLoading}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg
              transition-all duration-300 ease-out
              ${file && !isLoading
                ? "bg-[#35AEF3] hover:bg-[#4FBEF5] text-white shadow-lg shadow-[#35AEF3]/25 hover:shadow-[#35AEF3]/40 hover:scale-[1.02]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing document...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Extract Text
              </span>
            )}
          </button>
        </section>

        {/* Results Section */}
        {showResults && ocrResponse && (
          <ResultsPanel
            response={ocrResponse}
            onCopyText={handleCopyText}
            onCopyJson={handleCopyJson}
            onDownloadText={handleDownloadText}
            onDownloadJson={handleDownloadJson}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-gray-600 text-sm">
            Powered by ConqrOCR • Your data is processed in-memory and never stored
          </p>
        </footer>
      </main>
    </div>
  );
}
