"use client";

import React, { useState, useEffect } from 'react';
import { extractTextFromPDF } from '@/lib/engine/pdfEngine';
import { GitCompare, FileText, RefreshCw } from 'lucide-react';

interface ComparePdfViewerProps {
  files: File[];
}

export function ComparePdfViewer({ files }: ComparePdfViewerProps) {
  const [fileAText, setFileAText] = useState<string>('');
  const [fileBText, setFileBText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [comparisonMode, setComparisonMode] = useState<'text' | 'visual' | 'layout'>('text');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);

  useEffect(() => {
    async function loadTexts() {
      if (files.length < 2) return;
      setLoading(true);

      try {
        const [textA, textB] = await Promise.all([
          extractTextFromPDF(files[0]),
          extractTextFromPDF(files[1]),
        ]);

        setFileAText(textA.filter(t => t.trim()).join('\n\n'));
        setFileBText(textB.filter(t => t.trim()).join('\n\n'));
      } catch (e) {
        console.error('Error extracting text for comparison:', e);
      } finally {
        setLoading(false);
      }
    }

    loadTexts();
  }, [files]);

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Extracting and comparing document text streams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-red-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Document Comparison Controls
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-600">Mode:</span>
            {(['text', 'visual', 'layout'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setComparisonMode(mode)}
                className={`px-3 py-1.5 rounded-xl border capitalize transition ${
                  comparisonMode === mode ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="accent-red-600 rounded"
            />
            <span>Ignore extra whitespace and linebreaks</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col h-[500px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FileText className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-extrabold text-xs text-slate-900 truncate">Document A: {files[0]?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {fileAText || (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                ⚠️ Scanned or image-based document detected with no vector text. Please run OCR PDF first to convert to searchable text.
              </div>
            )}
          </div>
        </div>

        {/* Document B */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col h-[500px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-extrabold text-xs text-slate-900 truncate">Document B: {files[1]?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {fileBText || (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                ⚠️ Scanned or image-based document detected with no vector text. Please run OCR PDF first to convert to searchable text.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
