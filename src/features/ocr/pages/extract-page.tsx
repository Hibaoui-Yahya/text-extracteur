"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  DocumentUpload,
  DocumentText1,
  Gallery,
  CloseCircle,
  Copy,
  TickCircle,
  DocumentDownload,
  ArrowRotateLeft,
} from "iconsax-react";
import { validateFile } from "@/core/utils/file-validation";
import { ExtractHeader } from "@/shared/ui/extract-header";

interface ExtractResponse {
  markdown: string;
  pages: number;
  processing_time_ms: number;
}

const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="my-5 overflow-x-auto rounded-lg border border-[var(--color-border-subtle)]">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--color-surface-raised)]" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border-default)]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-4 py-2.5 text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="transition-colors hover:bg-[var(--color-accent-muted)]"
      {...props}
    >
      {children}
    </tr>
  ),
  h1: ({ children, ...props }) => (
    <h1
      className="text-2xl font-bold text-[var(--color-text-primary)] mt-8 mb-4 pb-3 border-b border-[var(--color-border-subtle)]"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-xl font-bold text-[var(--color-text-primary)] mt-7 mb-3"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-lg font-semibold text-[var(--color-text-primary)] mt-5 mb-2"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-base font-semibold text-[var(--color-text-primary)] mt-4 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p
      className="text-[var(--color-text-primary)] leading-[1.75] my-3"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-3 ml-1 space-y-1.5 list-none" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-3 ml-1 space-y-1.5 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      className="text-[var(--color-text-primary)] leading-relaxed pl-1 flex gap-2 items-baseline"
      {...props}
    >
      <span className="text-[var(--color-accent)] text-xs mt-1.5 shrink-0">&#9679;</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 pl-4 border-l-2 border-[var(--color-accent)] text-[var(--color-text-secondary)] italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`block text-sm ${className || ""}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-[var(--color-accent)] text-[0.875em] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="my-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] overflow-x-auto text-sm font-mono text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </pre>
  ),
  hr: (props) => (
    <hr
      className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent"
      {...props}
    />
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline underline-offset-2 decoration-[var(--color-accent)]/30 hover:decoration-[var(--color-accent)] transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--color-text-primary)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="text-[var(--color-text-primary)] italic" {...props}>
      {children}
    </em>
  ),
  img: ({ ...props }) => (
    <img
      className="my-4 rounded-lg border border-[var(--color-border-subtle)] max-w-full"
      {...props}
    />
  ),
};

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

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
      setResult(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFileWrapper(droppedFile)) {
      setFile(droppedFile);
      setError("");
      setResult(null);
    }
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const ext = item.type.split("/")[1] || "png";
          const f = new File([blob], `pasted-image-${Date.now()}.${ext}`, {
            type: item.type,
          });
          if (validateFileWrapper(f)) {
            setFile(f);
            setError("");
            setResult(null);
          }
        }
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
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
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      setResult(data);

      // Scroll to result after render
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.markdown) {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setCopyFlash(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setCopyFlash(false), 400);
    }
  };

  const handleDownload = () => {
    if (result?.markdown) {
      const blob = new Blob([result.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extracted-${file?.name?.replace(/\.[^.]+$/, "") || "document"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNewExtraction = () => {
    handleClear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type === "application/pdf")
      return <DocumentText1 size={28} color="#f87171" variant="Bold" />;
    return <Gallery size={28} color="#60a5fa" variant="Bold" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="grain min-h-screen bg-[var(--color-background)]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-[var(--color-accent)]/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[var(--color-accent)]/[0.03] blur-[100px]" />
      </div>

      <ExtractHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-10">
        {/* Header */}
        <header className="text-center mb-14">
          <div className="inline-flex items-center justify-center mb-5">
            <img
              src="/Conqrai_logo.svg"
              alt="ConqrAI"
              className="h-16 object-contain opacity-90"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
            Smart Document Extraction
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base max-w-md mx-auto leading-relaxed">
            Tables, lists, any language, any layout.
            <br />
            <span className="text-[var(--color-text-muted)]">
              One result, perfectly formatted.
            </span>
          </p>
        </header>

        {/* Upload zone */}
        <section className="mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed
              transition-all duration-300 ease-out
              ${
                isDragging
                  ? "upload-zone-active bg-[var(--color-accent-muted)] scale-[1.01]"
                  : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)]"
              }
              ${file ? "p-6" : "p-10 md:p-14"}
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
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-surface-overlay)] border border-[var(--color-border-subtle)]">
                  {getFileIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text-primary)] font-semibold truncate">
                    {file.name}
                  </p>
                  <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-2 rounded-lg hover:bg-[var(--color-surface-overlay)]"
                  title="Remove file"
                >
                  <CloseCircle size={20} variant="Bold" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-surface-overlay)] border border-[var(--color-border-subtle)]">
                  <DocumentUpload
                    size={28}
                    color="var(--color-text-muted)"
                    variant="Bold"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[var(--color-text-primary)] font-semibold text-lg">
                    Drop a document or{" "}
                    <span className="text-[var(--color-accent)]">browse</span>
                  </p>
                  <p className="text-[var(--color-text-muted)] text-sm mt-2.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-xs font-mono text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      Ctrl
                    </kbd>{" "}
                    <span className="text-[var(--color-text-muted)]">+</span>{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-overlay)] text-xs font-mono text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      V
                    </kbd>{" "}
                    to paste an image from clipboard
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {["PDF", "PNG", "JPG", "WebP"].map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
                      >
                        {fmt}
                      </span>
                    ))}
                    <span className="text-[var(--color-text-muted)] text-xs ml-1">
                      up to 50 MB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-error)]/[0.08] border border-[var(--color-error)]/20">
            <div className="flex items-start gap-3">
              <CloseCircle
                size={18}
                color="var(--color-error)"
                variant="Bold"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[var(--color-error)] text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Extract Button */}
        <section className="mb-10">
          <button
            onClick={handleExtract}
            disabled={!file || isLoading}
            className={`
              w-full py-3.5 px-6 rounded-xl font-semibold text-base
              transition-all duration-300 ease-out
              ${
                file && !isLoading
                  ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-[0_0_24px_var(--color-accent-glow)] hover:shadow-[0_0_32px_var(--color-accent-glow)] hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border-subtle)]"
              }
            `}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-3">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extracting...
              </span>
            ) : (
              "Extract"
            )}
          </button>
        </section>

        {/* Loading state */}
        {isLoading && (
          <section className="mb-10">
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 overflow-hidden">
              <div className="loading-shimmer h-1" />
              <div className="p-6 flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                  </div>
                </div>
                <div>
                  <p className="text-[var(--color-text-primary)] font-semibold text-sm">
                    Analyzing document
                  </p>
                  <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
                    Extracting structure, tables, lists, and text across all
                    languages...
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Result */}
        {result && (
          <section ref={resultRef} className="mb-10 result-enter scroll-mt-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-text-muted)] text-xs font-medium">
                  {result.pages} page{result.pages > 1 ? "s" : ""}
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-border-default)]" />
                <span className="text-[var(--color-text-muted)] text-xs">
                  {result.processing_time_ms}ms
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    border border-[var(--color-border-subtle)]
                    ${
                      copied
                        ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
                        : "bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }
                    ${copyFlash ? "copy-flash" : ""}
                  `}
                >
                  {copied ? (
                    <>
                      <TickCircle size={14} variant="Bold" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                    border border-[var(--color-border-subtle)]"
                >
                  <DocumentDownload size={14} />
                  Download
                </button>
                <button
                  onClick={handleNewExtraction}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                    border border-[var(--color-border-subtle)]"
                >
                  <ArrowRotateLeft size={14} />
                  New
                </button>
              </div>
            </div>

            {/* Document viewer */}
            <div className="document-viewer rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-sm overflow-hidden">
              <div className="p-6 md:p-10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {result.markdown}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center pb-8">
          <p className="text-[var(--color-text-muted)] text-xs tracking-wide">
            Powered by ConqrOCR &mdash; Processed in-memory, never stored
          </p>
        </footer>
      </main>
    </div>
  );
}
