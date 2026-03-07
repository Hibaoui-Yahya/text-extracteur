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

      const apiUrl = process.env.NEXT_PUBLIC_OCR_API_URL
        ? `${process.env.NEXT_PUBLIC_OCR_API_URL}/api/ocr/extract`
        : "/api/ocr/extract";

      const response = await fetch(apiUrl, {
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
    <div className="grain min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Landing-page-style ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#35AEF3]/10 via-transparent to-transparent" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[#35AEF3]/[0.06] blur-[120px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#35AEF3]/[0.04] blur-[100px]" />
        <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] rounded-full bg-[#35AEF3]/[0.03] blur-[80px]" />
      </div>

      <ExtractHeader />

      <main
        className={`relative z-10 mx-auto px-5 py-10 transition-all duration-500 ${
          hasResults ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {/* Header — compact when results visible */}
        <header
          className={`text-center transition-all duration-500 ${hasResults ? "mb-6" : "mb-12"}`}
        >
          <div
            className={`inline-flex items-center justify-center transition-all duration-500 ${hasResults ? "mb-2" : "mb-4"}`}
          >
            <img
              src="/Conqrai_logo.svg"
              alt="ConqrAI"
              className={`object-contain opacity-90 transition-all duration-500 ${hasResults ? "h-9" : "h-14"}`}
            />
          </div>
          <h1
            className={`font-extrabold tracking-tight transition-all duration-500 ${hasResults ? "text-lg mb-0 text-white" : "text-3xl md:text-4xl mb-3"}`}
          >
            <span className="text-white">Smart Document </span>
            <span className="bg-gradient-to-r from-[#35AEF3] to-[#4FBEF5] bg-clip-text text-transparent">Extraction</span>
          </h1>
          {!hasResults && (
            <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed mt-2">
              Tables, lists, any language, any layout.
              <br />
              <span className="text-gray-500">
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
                transition-all duration-300 ease-out backdrop-blur-sm
                ${
                  isDragging
                    ? "upload-zone-active bg-[#35AEF3]/10 scale-[1.01]"
                    : "border-gray-700 hover:border-[#35AEF3]/50 bg-gray-900/50 hover:bg-gray-900/70"
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
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {file.type === "application/pdf" && (
                    <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-lg border border-gray-700 bg-gray-800">
                      {getFileIcon()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {file.name}
                    </p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800"
                    title="Remove file"
                  >
                    <CloseCircle size={20} variant="Bold" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#35AEF3]/10 border border-[#35AEF3]/20">
                    <DocumentUpload
                      size={30}
                      color="#35AEF3"
                      variant="Bold"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">
                      Drop a document or{" "}
                      <span className="text-[#35AEF3]">browse</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-2.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-xs font-mono text-gray-400 border border-gray-700">
                        Ctrl
                      </kbd>{" "}
                      <span className="text-gray-600">+</span>{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-xs font-mono text-gray-400 border border-gray-700">
                        V
                      </kbd>{" "}
                      to paste an image from clipboard
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      {["PDF", "PNG", "JPG", "WebP"].map((fmt) => (
                        <span
                          key={fmt}
                          className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-400 border border-gray-700"
                        >
                          {fmt}
                        </span>
                      ))}
                      <span className="text-gray-500 text-xs ml-1">
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
          <div className="mb-6 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <CloseCircle
                size={18}
                color="#f87171"
                variant="Bold"
                className="shrink-0 mt-0.5"
              />
              <p className="text-red-400 text-sm">{error}</p>
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
                w-full py-4 px-6 rounded-full font-semibold text-base
                transition-all duration-300 ease-out
                ${
                  file && !isLoading
                    ? "bg-[#35AEF3] hover:bg-[#4FBEF5] text-white shadow-lg shadow-[#35AEF3]/25 hover:shadow-xl hover:shadow-[#35AEF3]/30 hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                }
              `}
            >
              Extract Document
            </button>
          </section>
        )}

        {/* ===== PROCESSING + RESULTS AREA ===== */}
        {hasResults && (
          <section ref={resultRef} className="scroll-mt-6 result-enter">
            {/* Split layout: Preview | Content */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Document Preview */}
              {previewUrl && showPreview && (
                <div className="lg:w-[380px] shrink-0">
                  <div className="lg:sticky lg:top-20">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <Gallery size={14} color="#9ca3af" />
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                          Original
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-800/50"
                        title="Hide preview"
                      >
                        <EyeSlash size={14} />
                      </button>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
                      {isImage ? (
                        <img
                          src={previewUrl}
                          alt="Document preview"
                          className="w-full h-auto max-h-[80vh] object-contain bg-gray-800/50"
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
                      bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white
                      border border-gray-700"
                  >
                    <Eye size={14} />
                    Show original
                  </button>
                )}

                {/* Loading */}
                {isLoading && (
                  <div className="mb-5">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
                      <div className="loading-shimmer h-1" />
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-10 h-10 rounded-full bg-[#35AEF3]/10 border border-[#35AEF3]/20 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border-2 border-[#35AEF3] border-t-transparent animate-spin" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {loadingStage === "verifying"
                                ? "Verifying accuracy..."
                                : "Extracting text..."}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {loadingStage === "verifying"
                                ? "Comparing OCR output against original image"
                                : "Analyzing structure, tables, and multilingual content"}
                            </p>
                          </div>
                        </div>
                        {/* Stage indicators */}
                        <div className="flex items-center gap-5 text-xs pl-1">
                          <div
                            className={`flex items-center gap-1.5 ${
                              loadingStage === "verifying"
                                ? "text-emerald-400"
                                : "text-[#35AEF3]"
                            }`}
                          >
                            {loadingStage === "verifying" ? (
                              <TickCircle size={13} variant="Bold" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border-[1.5px] border-[#35AEF3] border-t-transparent animate-spin" />
                            )}
                            <span className="font-medium">OCR</span>
                          </div>
                          {isImage && (
                            <div
                              className={`flex items-center gap-1.5 ${
                                loadingStage === "verifying"
                                  ? "text-[#35AEF3]"
                                  : "text-gray-600"
                              }`}
                            >
                              {loadingStage === "verifying" ? (
                                <div className="w-3 h-3 rounded-full border-[1.5px] border-[#35AEF3] border-t-transparent animate-spin" />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-gray-700" />
                              )}
                              <span className="font-medium">Vision verify</span>
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      {/* Stats */}
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <DocumentText1 size={13} color="#9ca3af" />
                          <span className="text-gray-400 text-xs font-medium">
                            {result.pages} page{result.pages > 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="w-px h-3 bg-gray-700" />
                        <span className="text-gray-500 text-xs">
                          {result.processing_time_ms}ms
                        </span>
                        {result.verified && (
                          <>
                            <span className="w-px h-3 bg-gray-700" />
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                              <ShieldTick size={13} variant="Bold" />
                              Verified
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className={`
                            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all
                            border
                            ${
                              copied
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700"
                            }
                            ${copyFlash ? "copy-flash" : ""}
                          `}
                        >
                          {copied ? (
                            <>
                              <TickCircle size={16} variant="Bold" color="#34d399" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={16} variant="Bold" color="currentColor" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all
                            bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white
                            border border-gray-700"
                        >
                          <DocumentDownload size={16} variant="Bold" color="currentColor" />
                          Download
                        </button>
                        <button
                          onClick={handleNewExtraction}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all
                            bg-[#35AEF3]/10 hover:bg-[#35AEF3]/20 text-[#35AEF3]
                            border border-[#35AEF3]/20 hover:border-[#35AEF3]/40"
                        >
                          <ArrowRotateLeft size={16} variant="Bold" color="currentColor" />
                          New
                        </button>
                      </div>
                    </div>

                    {/* Document viewer */}
                    <div className="document-viewer rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
                      <div dir="auto" className="p-6 md:p-8 lg:p-10">
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
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs tracking-wide">
            <div className="w-2 h-2 rounded-full bg-[#35AEF3] animate-pulse" />
            <span>Powered by ConqrOCR</span>
            <span>&middot;</span>
            <span>Processed in-memory, never stored</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
