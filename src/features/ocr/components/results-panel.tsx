"use client";

import { useState, useCallback } from 'react';
import { Copy, Download, AlertTriangle, CheckCircle, FileText, Code, Layout } from 'lucide-react';
import { OCRSystemResponse } from '@/shared/types/ocr-system.types';

export function ResultsPanel({ 
  response,
  onCopyText,
  onCopyJson,
  onDownloadText,
  onDownloadJson
}: {
  response: OCRSystemResponse;
  onCopyText: () => void;
  onCopyJson: () => void;
  onDownloadText: () => void;
  onDownloadJson: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'text' | 'json' | 'layout'>('text');
  const [showWarnings, setShowWarnings] = useState(false);

  const formatJson = useCallback((obj: any) => {
    return JSON.stringify(obj, null, 2);
  }, []);

  const renderTextTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 font-mono text-sm">
        <pre className="whitespace-pre-wrap break-words">{response.plain_text}</pre>
      </div>
      
      {response.quality.warnings.length > 0 && (
        <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-300 mb-2">Quality Warnings</h3>
              <p className="text-yellow-200 text-sm">
                This document may require review due to:
              </p>
              <ul className="list-disc list-inside text-yellow-100 text-sm mt-2 space-y-1">
                {response.quality.warnings.slice(0, 3).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {response.quality.warnings.length > 3 && (
                  <li>...and {response.quality.warnings.length - 3} more</li>
                )}
              </ul>
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="mt-3 text-yellow-300 text-sm hover:text-yellow-100 transition-colors"
              >
                {showWarnings ? 'Hide Details' : 'Show All Warnings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderJsonTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
        <pre>{formatJson(response)}</pre>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Confidence
          </h4>
          <p className="text-2xl font-bold text-green-400">
            {(response.quality.overall_confidence * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {response.quality.needs_review ? 'Review recommended' : 'High confidence'}
          </p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Document Type
          </h4>
          <p className="font-mono text-blue-300">{response.doc_type}</p>
          <p className="text-xs text-gray-400 mt-1">
            {response.quality.warnings.includes('DOC_TYPE_UNCERTAIN') ? 'Uncertain' : 'Confident'}
          </p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <Layout className="w-4 h-4 text-purple-400" />
            Pages
          </h4>
          <p className="text-2xl font-bold text-purple-400">
            {response.doc_model.pages.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {response.doc_model.formatting.has_tables ? 'With tables' : 'No tables'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderLayoutTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-300 mb-3">Document Structure</h4>
        <div className="space-y-3">
          {response.doc_model.reading_order.map((element, index) => (
            <div key={element.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{index + 1}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full">
                  {element.type}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {typeof element.content === 'string' 
                  ? element.content.substring(0, 100) + (element.content.length > 100 ? '...' : '')
                  : typeof element.content === 'object' && 'headers' in element.content
                    ? `Table: ${element.content.headers.join(', ')}`
                    : typeof element.content === 'object' && 'key' in element.content
                      ? `${element.content.key}: ${element.content.value}`
                      : 'Complex content'}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-300 mb-3">Formatting Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-400 mb-1">Bold Text</p>
            <p className="font-mono">
              {response.doc_model.formatting.has_bold === true ? 'Yes' : 
               response.doc_model.formatting.has_bold === false ? 'No' : 'Unknown'}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-400 mb-1">Italic Text</p>
            <p className="font-mono">
              {response.doc_model.formatting.has_italic === true ? 'Yes' : 
               response.doc_model.formatting.has_italic === false ? 'No' : 'Unknown'}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-400 mb-1">Underline</p>
            <p className="font-mono">
              {response.doc_model.formatting.has_underline === true ? 'Yes' : 
               response.doc_model.formatting.has_underline === false ? 'No' : 'Unknown'}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-400 mb-1">Multi-column</p>
            <p className="font-mono">
              {response.doc_model.formatting.multi_column === true ? 'Yes' : 
               response.doc_model.formatting.multi_column === false ? 'No' : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      {/* Processing Info */}
      <div className="mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-300">Processing Complete</h3>
            <p className="text-sm text-gray-400">
              {response.doc_model.pages.length} page(s) • 
              {response.processing_time_ms}ms • 
              {response.doc_type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {response.quality.needs_review && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-800 text-yellow-200 rounded-full">
                Review Needed
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-green-800 text-green-200 rounded-full">
              {(response.quality.overall_confidence * 100).toFixed(0)}% Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={onCopyText}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy Text
        </button>
        <button
          onClick={onDownloadText}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download .txt
        </button>
        <button
          onClick={onCopyJson}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Code className="w-4 h-4" />
          Copy JSON
        </button>
        <button
          onClick={onDownloadJson}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download .json
        </button>
      </div>

      {/* Results Tabs */}
      <div className="border-b border-gray-800 mb-4">
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'border-b-2 border-blue-500 text-blue-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Plain Text
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'json'
                ? 'border-b-2 border-green-500 text-green-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code className="w-4 h-4 inline-block mr-2" />
            Structured JSON
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'layout'
                ? 'border-b-2 border-purple-500 text-purple-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layout className="w-4 h-4 inline-block mr-2" />
            Document Model
          </button>
        </nav>
      </div>

      {/* Results Content */}
      <div className="results-content">
        {activeTab === 'text' && renderTextTab()}
        {activeTab === 'json' && renderJsonTab()}
        {activeTab === 'layout' && renderLayoutTab()}
      </div>

      {/* Warnings Modal */}
      {showWarnings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Quality Warnings
              </h3>
              <button
                onClick={() => setShowWarnings(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {response.quality.warnings.map((warning, index) => (
                <div key={index} className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-200 font-mono text-sm">{warning}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowWarnings(false)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}