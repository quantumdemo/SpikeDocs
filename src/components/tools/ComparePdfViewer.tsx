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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTexts() {
      if (files.length < 2) return;
      setLoading(true);

      const [textA, textB] = await Promise.all([
        extractTextFromPDF(files[0]),
        extractTextFromPDF(files[1]),
      ]);

      setFileAText(textA.join('\n\n'));
      setFileBText(textB.join('\n\n'));
      setLoading(false);
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
      <div className="flex items-center gap-2 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <GitCompare className="w-5 h-5 text-red-600" />
        <h3 className="text-xs font-bold text-slate-800">Side-By-Side Synchronized PDF Document Comparison</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col h-[500px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FileText className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-extrabold text-xs text-slate-900 truncate">Document A: {files[0]?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
            {fileAText || 'No readable text content extracted.'}
          </div>
        </div>

        {/* Document B */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col h-[500px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-extrabold text-xs text-slate-900 truncate">Document B: {files[1]?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
            {fileBText || 'No readable text content extracted.'}
          </div>
        </div>
      </div>
    </div>
  );
}
