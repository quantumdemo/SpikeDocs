"use client";

import React, { useState, useRef } from 'react';
import { ToolDefinition } from '@/config/tools';
import { Upload, File, CheckCircle2, AlertCircle, ArrowRight, Download, RefreshCw, Lock, Sparkles, Shield, Trash2 } from 'lucide-react';
import { PdfSignatureViewer } from './PdfSignatureViewer';
import { PageOrganizerGrid } from './PageOrganizerGrid';
import { RedactionOverlayViewer } from './RedactionOverlayViewer';
import { ComparePdfViewer } from './ComparePdfViewer';

interface ToolProcessorProps {
  tool: ToolDefinition;
  onProcess: (files: File[], options: Record<string, any>) => Promise<{ downloadUrl: string; fileName: string; textOutput?: string }>;
}

export function ToolProcessor({ tool, onProcess }: ToolProcessorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ downloadUrl: string; fileName: string; textOutput?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom tool options states
  const [splitRange, setSplitRange] = useState('1-3');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [password, setPassword] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [summaryStyle, setSummaryStyle] = useState<'executive' | 'bullet' | 'concise'>('executive');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = Array.from(e.dataTransfer.files);
      setFiles(selected);
      setError(null);
      setResult(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRunProcess = async () => {
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgressMessage('Processing locally in browser memory...');

    try {
      const options = {
        splitRange,
        watermarkText,
        password,
        targetLang,
        summaryStyle,
      };

      const res = await onProcess(files, options);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during file processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInteractiveSave = (processedBytes: Uint8Array) => {
    const blob = new Blob([processedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    setResult({
      downloadUrl,
      fileName: `spikedocs_${tool.slug}_result.pdf`,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10 my-8">
      {/* Zero Data Banner */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold mb-8 w-fit mx-auto">
        <Shield className="w-4 h-4 text-emerald-600" />
        <span>100% Client-Side Processing • Your files are never uploaded to any server</span>
      </div>

      {result ? (
        <div className="text-center py-8 space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">Processing Complete!</h3>
            <p className="text-sm text-slate-500 mt-1">Your output file was generated instantly in your browser memory.</p>
          </div>

          {result.textOutput && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left max-h-60 overflow-y-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Output Preview / Content</span>
              <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono">{result.textOutput}</pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={result.downloadUrl}
              download={result.fileName}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-red-500/25 transition transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              <span>Download {result.fileName}</span>
            </a>
            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base rounded-2xl transition"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Convert Another File</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Upload Box */}
          {files.length === 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/60 hover:bg-red-50/30 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple={tool.id === 'merge-pdf' || tool.id === 'jpg-to-pdf' || tool.id === 'compare-pdf'}
                accept={tool.accept}
                className="hidden"
              />
              <div className="w-16 h-16 bg-red-100 group-hover:bg-red-600 text-red-600 group-hover:text-white rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 shadow-md">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="mt-4 text-lg font-bold text-slate-800">
                Select {tool.title} Files or Drag & Drop
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supports {tool.acceptedFileTypesDescription} • Maximum size 50MB (Free)
              </p>
            </div>
          )}

          {/* Specialized Interactive Viewers */}
          {files.length > 0 && tool.id === 'sign-pdf' && (
            <PdfSignatureViewer file={files[0]} onApplySignature={handleInteractiveSave} />
          )}

          {files.length > 0 && (tool.id === 'organize-pdf' || tool.id === 'extract-pdf' || tool.id === 'rotate-pdf') && (
            <PageOrganizerGrid file={files[0]} mode={tool.id === 'extract-pdf' ? 'extract' : tool.id === 'rotate-pdf' ? 'rotate' : 'organize'} onSave={handleInteractiveSave} />
          )}

          {files.length > 0 && tool.id === 'redact-pdf' && (
            <RedactionOverlayViewer file={files[0]} onApplyRedaction={handleInteractiveSave} />
          )}

          {files.length >= 2 && tool.id === 'compare-pdf' && (
            <ComparePdfViewer files={files} />
          )}

          {/* Standard Upload List & Settings for non-interactive tools */}
          {files.length > 0 && !['sign-pdf', 'organize-pdf', 'extract-pdf', 'rotate-pdf', 'redact-pdf', 'compare-pdf'].includes(tool.id) && (
            <>
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Files ({files.length})</span>
                  <button onClick={() => setFiles([])} className="text-xs text-red-600 hover:underline font-semibold">Clear all</button>
                </div>
                <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <File className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700">{file.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurations */}
              <div className="p-5 bg-slate-100/80 rounded-2xl space-y-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Tool Configuration</span>

                {tool.id === 'split-pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Page Ranges (e.g. 1-3, 5, 7)</label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}

                {tool.id === 'watermark' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}

                {(tool.id === 'protect-pdf' || tool.id === 'unlock-pdf') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Document Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}

                {tool.id === 'translate-pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Language</label>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>
                )}

                {tool.id === 'ai-summarizer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Summary Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['executive', 'bullet', 'concise'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setSummaryStyle(style)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition capitalize ${
                            summaryStyle === style
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                disabled={files.length === 0 || isProcessing}
                onClick={handleRunProcess}
                className={`w-full py-4 px-8 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                  files.length === 0 || isProcessing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25 hover:shadow-red-500/40 transform hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{progressMessage}</span>
                  </>
                ) : (
                  <>
                    <span>Process {tool.title}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
