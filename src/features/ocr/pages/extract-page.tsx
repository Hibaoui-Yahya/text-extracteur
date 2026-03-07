"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Eye,
  EyeSlash,
  ShieldTick,
} from "iconsax-react";
import { validateFile } from "@/core/utils/file-validation";
import { ExtractHeader } from "@/shared/ui/extract-header";

interface ExtractResponse {
  markdown: string;
  pages: number;
  processing_time_ms: number;
  verified: boolean;
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
      dir="auto"
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
      dir="auto"
      className="text-2xl font-bold text-[var(--color-text-primary)] mt-8 mb-4 pb-3 border-b border-[var(--color-border-subtle)]"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      dir="auto"
      className="text-xl font-bold text-[var(--color-text-primary)] mt-7 mb-3"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      dir="auto"
      className="text-lg font-semibold text-[var(--color-text-primary)] mt-5 mb-2"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      dir="auto"
      className="text-base font-semibold text-[var(--color-text-primary)] mt-4 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p
      dir="auto"
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
      dir="auto"
      className="text-[var(--color-text-primary)] leading-relaxed pl-1 flex gap-2 items-baseline"
      {...props}
    >
      <span className="text-[var(--color-accent)] text-xs mt-1.5 shrink-0">
        &#9679;
      </span>
      <span className="flex-1">{children}</span>
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
        <code className={`block text-sm ${className || ""}`} {...props}>
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
    <strong
      className="font-semibold text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="text-[var(--color-text-primary)] italic" {...props}>
      {children}
    </em>
  ),
  // Strip images — OCR returns references to non-existent files, we only want text
  img: () => null,
};

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    "ocr" | "verifying" | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  // Create a stable preview URL for the uploaded file
  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isImage = file ? file.type !== "application/pdf" : false;

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
    setLoadingStage("ocr");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Show "verifying" stage for images after a delay (OCR typically takes a few seconds)
      const isImg = file.type !== "application/pdf";
      let verifyTimer: ReturnType<typeof setTimeout> | undefined;
      if (isImg) {
        verifyTimer = setTimeout(() => setLoadingStage("verifying"), 5000);
      }

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      if (verifyTimer) clearTimeout(verifyTimer);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setLoadingStage(null);
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
    setLoadingStage(null);
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

  // Whether we're in "results mode" (show split view)
  const hasResults = result !== null || isLoading;

  return (
    <div className="grain min-h-screen bg-[var(--color-background)]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-[var(--color-accent)]/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[var(--color-accent)]/[0.03] blur-[100px]" />
      </div>

      <ExtractHeader />

      <main
        className={`relative z-10 mx-auto px-5 py-10 transition-all duration-500 ${
          hasResults ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {/* Header — compact when results visible */}
        <header
          className={`text-center transition-all duration-500 ${hasResults ? "mb-8" : "mb-14"}`}
        >
          <div
            className={`inline-flex items-center justify-center transition-all duration-500 ${hasResults ? "mb-3" : "mb-5"}`}
          >
            <img
              src="/Conqrai_logo.svg"
              alt="ConqrAI"
              className={`object-contain opacity-90 transition-all duration-500 ${hasResults ? "h-10" : "h-16"}`}
            />
          </div>
          <h1
            className={`font-extrabold tracking-tight text-[var(--color-text-primary)] transition-all duration-500 ${hasResults ? "text-xl mb-1" : "text-3xl md:text-4xl mb-3"}`}
          >
            Smart Document Extraction
          </h1>
          {!hasResults && (
            <p className="text-[var(--color-text-secondary)] text-base max-w-md mx-auto leading-relaxed">
              Tables, lists, any language, any layout.
              <br />
              <span className="text-[var(--color-text-muted)]">
                One result, perfectly formatted.
              </span>
            </p>
          )}
        </header>

        {/* Upload zone — compact when results visible */}
        {!hasResults && (
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
                  {/* Thumbnail preview */}
                  {previewUrl && isImage && (
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {file.type === "application/pdf" && (
                    <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]">
                      {getFileIcon()}
                    </div>
                  )}
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
        )}

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

        {/* Extract Button — only when no results yet */}
        {!hasResults && (
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
              Extract
            </button>
          </section>
        )}

        {/* ===== PROCESSING + RESULTS AREA ===== */}
        {hasResults && (
          <section ref={resultRef} className="scroll-mt-6 result-enter">
            {/* Split layout: Preview | Content */}
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left: Document Preview */}
              {previewUrl && showPreview && (
                <div className="lg:w-[380px] shrink-0">
                  <div className="lg:sticky lg:top-20">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
                        Original
                      </span>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1 rounded"
                        title="Hide preview"
                      >
                        <EyeSlash size={14} />
                      </button>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 overflow-hidden">
                      {isImage ? (
                        <img
                          src={previewUrl}
                          alt="Document preview"
                          className="w-full h-auto max-h-[80vh] object-contain bg-[var(--color-surface-overlay)]"
                        />
                      ) : (
                        <embed
                          src={previewUrl}
                          type="application/pdf"
                          className="w-full h-[80vh]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Results / Loading */}
              <div className="flex-1 min-w-0">
                {/* Show preview toggle when hidden */}
                {!showPreview && previewUrl && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                      border border-[var(--color-border-subtle)]"
                  >
                    <Eye size={14} />
                    Show original
                  </button>
                )}

                {/* Loading */}
                {isLoading && (
                  <div className="mb-5">
                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 overflow-hidden">
                      <div className="loading-shimmer h-1" />
                      <div className="p-5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                          </div>
                          <div>
                            <p className="text-[var(--color-text-primary)] font-semibold text-sm">
                              {loadingStage === "verifying"
                                ? "Verifying accuracy..."
                                : "Extracting text..."}
                            </p>
                            <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
                              {loadingStage === "verifying"
                                ? "Comparing OCR output against original image"
                                : "Analyzing structure, tables, and multilingual content"}
                            </p>
                          </div>
                        </div>
                        {/* Stage indicators */}
                        <div className="flex items-center gap-4 text-xs pl-1">
                          <div
                            className={`flex items-center gap-1.5 ${
                              loadingStage === "verifying"
                                ? "text-[var(--color-success)]"
                                : "text-[var(--color-accent)]"
                            }`}
                          >
                            {loadingStage === "verifying" ? (
                              <TickCircle size={12} variant="Bold" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border-[1.5px] border-[var(--color-accent)] border-t-transparent animate-spin" />
                            )}
                            <span>OCR</span>
                          </div>
                          {isImage && (
                            <div
                              className={`flex items-center gap-1.5 ${
                                loadingStage === "verifying"
                                  ? "text-[var(--color-accent)]"
                                  : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {loadingStage === "verifying" ? (
                                <div className="w-3 h-3 rounded-full border-[1.5px] border-[var(--color-accent)] border-t-transparent animate-spin" />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-[var(--color-border-default)]" />
                              )}
                              <span>Vision verify</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--color-text-muted)] text-xs font-medium">
                          {result.pages} page
                          {result.pages > 1 ? "s" : ""}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-border-default)]" />
                        <span className="text-[var(--color-text-muted)] text-xs">
                          {result.processing_time_ms}ms
                        </span>
                        {result.verified && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-border-default)]" />
                            <span className="flex items-center gap-1 text-[var(--color-success)] text-xs font-medium">
                              <ShieldTick size={12} variant="Bold" />
                              Verified
                            </span>
                          </>
                        )}
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
                      <div dir="auto" className="p-6 md:p-8">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {result.markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
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
