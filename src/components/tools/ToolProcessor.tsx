"use client";

import React, { useState, useRef } from 'react';
import { ToolDefinition } from '@/config/tools';
import { Upload, File, CheckCircle2, AlertCircle, ArrowRight, Download, RefreshCw, Lock, Sparkles, Shield, Trash2, Crown } from 'lucide-react';
import Link from 'next/link';
import { PdfSignatureViewer } from './PdfSignatureViewer';
import { PageOrganizerGrid } from './PageOrganizerGrid';
import { RedactionOverlayViewer } from './RedactionOverlayViewer';
import { ComparePdfViewer } from './ComparePdfViewer';
import { PdfCropViewer } from './PdfCropViewer';
import { PdfWatermarkViewer } from './PdfWatermarkViewer';
import { PdfEditorViewer } from './PdfEditorViewer';

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
  const [splitMethod, setSplitMethod] = useState<'every' | 'range'>('range');
  const [splitRange, setSplitRange] = useState('1-3');
  const [watermarkType, setWatermarkType] = useState<'text' | 'confidential' | 'draft'>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(30);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(45);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetKb, setTargetKb] = useState<string>('');
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-center' | 'top-right'>('bottom-center');
  const [pageNumberStart, setPageNumberStart] = useState<number>(1);
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'standard'>('high');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [ocrLang, setOcrLang] = useState<string>('eng');
  const [repairMode, setRepairMode] = useState<'structure' | 'stream'>('structure');
  const [conversionLayout, setConversionLayout] = useState<'standard' | 'enhanced'>('enhanced');
  const [urlInput, setUrlInput] = useState<string>('https://');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [summaryStyle, setSummaryStyle] = useState<'executive' | 'bullet' | 'concise'>('executive');

  // Client-side Usage & Tier Guard
  const [dailyUploads, setDailyUploads] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('spikedocs_usage_date');
      if (savedDate !== today) {
        localStorage.setItem('spikedocs_usage_date', today);
        localStorage.setItem('spikedocs_daily_uploads', '0');
        return 0;
      }
      return parseInt(localStorage.getItem('spikedocs_daily_uploads') || '0', 10);
    }
    return 0;
  });

  const [isProUser, setIsProUser] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spikedocs_is_pro') === 'true';
    }
    return false;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);

      // Check daily upload limit for free users (maximum 5 uploads per day)
      if (!isProUser && dailyUploads + selected.length > 5) {
        setError('Free tier limit reached (maximum 5 files per day). Please upgrade to SpikeDocs Pro for unlimited uploads.');
        return;
      }

      // Pre-check with IP rate-limiting backend
      if (!isProUser) {
        fetch('/api/usage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileCount: selected.length, increment: false }),
        })
          .then(res => res.json())
          .then(data => {
            if (!data.allowed) {
              setError(data.error || 'Your IP address has reached the 5 daily free upload limit. Please sign in or upgrade to SpikeDocs Pro.');
            }
          })
          .catch(() => {});
      }

      setFiles(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = Array.from(e.dataTransfer.files);

      if (!isProUser && dailyUploads + selected.length > 5) {
        setError('Free tier limit reached (maximum 5 files per day). Please upgrade to SpikeDocs Pro for unlimited uploads.');
        return;
      }

      if (!isProUser) {
        fetch('/api/usage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileCount: selected.length, increment: false }),
        })
          .then(res => res.json())
          .then(data => {
            if (!data.allowed) {
              setError(data.error || 'Your IP address has reached the 5 daily free upload limit. Please sign in or upgrade to SpikeDocs Pro.');
            }
          })
          .catch(() => {});
      }

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

    // Gate Pro tools from non-pro users
    if (tool.isPro && !isProUser) {
      setError('This tool is exclusive to SpikeDocs Pro members. Please upgrade to Pro or sign in to continue.');
      return;
    }

    // Enforce daily upload limit
    if (!isProUser && dailyUploads >= 5) {
      setError('You have used all 5 free daily uploads. Upgrade to SpikeDocs Pro for unlimited access.');
      return;
    }

    // Check IP rate limiter
    if (!isProUser) {
      try {
        const ipCheckRes = await fetch('/api/usage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileCount: files.length, increment: false }),
        });
        const ipCheckData = await ipCheckRes.json();
        if (!ipCheckData.allowed) {
          setError(ipCheckData.error || 'Your IP address has reached the 5 daily upload limit. Please sign in or upgrade to continue.');
          return;
        }
      } catch (err) {
        console.warn('IP check bypass on network failure:', err);
      }
    }

    setIsProcessing(true);
    setError(null);
    setProgressMessage('Processing locally in browser memory...');

    if (tool.id === 'protect-pdf' && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      setIsProcessing(false);
      return;
    }

    try {
      const options = {
        splitRange: splitMethod === 'every' ? 'all' : splitRange,
        watermarkText: watermarkType === 'confidential' ? 'CONFIDENTIAL' : watermarkType === 'draft' ? 'DRAFT' : watermarkText,
        watermarkOpacity: watermarkOpacity / 100,
        watermarkRotation,
        password,
        compressionLevel,
        targetKb: targetKb ? parseInt(targetKb, 10) : undefined,
        pageNumberPosition,
        pageNumberStart,
        imageQuality,
        pageSize,
        pageOrientation,
        ocrLang,
        repairMode,
        conversionLayout,
        targetLang,
        summaryStyle,
        url: urlInput,
      };

      const res = await onProcess(files, options);
      setResult(res);

      // Increment daily upload counter for free users (Local and IP level)
      if (!isProUser && typeof window !== 'undefined') {
        const nextCount = dailyUploads + files.length;
        setDailyUploads(nextCount);
        localStorage.setItem('spikedocs_daily_uploads', nextCount.toString());

        // Increment IP backend counter to prevent incognito circumvention
        fetch('/api/usage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileCount: files.length, increment: true }),
        }).catch(() => {});
      }
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
      {/* Zero Data Banner & Tier Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>100% Client-Side Processing • Your files are never uploaded to any server</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          {isProUser ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Pro Active (Unlimited)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl">
              <span>Free Plan ({Math.max(0, 5 - dailyUploads)}/5 uploads left today)</span>
              <Link href="/pricing" className="text-red-600 hover:underline ml-1">Upgrade</Link>
            </span>
          )}
        </div>
      </div>

      {/* Pro Locked Gate for non-subscribed users */}
      {tool.isPro && !isProUser && (
        <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <h4 className="text-base font-extrabold text-slate-900">SpikeDocs Pro Feature</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {tool.title} is an advanced tool reserved for SpikeDocs Pro users and administrators. Subscribe or sign in with your Pro account to unlock.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Get SpikeDocs Pro
            </Link>
            <Link
              href="/auth/signin"
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

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

          {files.length > 0 && tool.id === 'crop-pdf' && (
            <PdfCropViewer file={files[0]} onApplyCrop={handleInteractiveSave} />
          )}

          {files.length > 0 && tool.id === 'watermark' && (
            <PdfWatermarkViewer file={files[0]} onApplyWatermark={handleInteractiveSave} />
          )}

          {files.length > 0 && (tool.id === 'edit-pdf' || tool.id === 'pdf-forms') && (
            <PdfEditorViewer file={files[0]} mode={tool.id === 'pdf-forms' ? 'forms' : 'edit'} onSave={handleInteractiveSave} />
          )}

          {files.length >= 2 && tool.id === 'compare-pdf' && (
            <ComparePdfViewer files={files} />
          )}

          {/* Standard Upload List & Settings for non-interactive tools */}
          {files.length > 0 && !['sign-pdf', 'organize-pdf', 'extract-pdf', 'rotate-pdf', 'redact-pdf', 'crop-pdf', 'watermark', 'edit-pdf', 'pdf-forms', 'compare-pdf'].includes(tool.id) && (
            <>
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Files ({files.length})</span>
                  <button onClick={() => setFiles([])} className="text-xs text-red-600 hover:underline font-semibold">Clear all</button>
                </div>
                <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                      {files.map((file, idx) => {
                        const moveUp = (index: number) => {
                          if (index === 0) return;
                          setFiles(prev => {
                            const updated = [...prev];
                            const temp = updated[index];
                            updated[index] = updated[index - 1];
                            updated[index - 1] = temp;
                            return updated;
                          });
                        };
                        const moveDown = (index: number) => {
                          if (index === files.length - 1) return;
                          setFiles(prev => {
                            const updated = [...prev];
                            const temp = updated[index];
                            updated[index] = updated[index + 1];
                            updated[index + 1] = temp;
                            return updated;
                          });
                        };

                        return (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className="w-5 h-5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <File className="w-4 h-4 text-red-600 shrink-0" />
                              <span className="truncate font-medium text-slate-700">{file.name}</span>
                              <span className="text-xs text-slate-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {files.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveUp(idx)}
                                    className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-20"
                                    title="Move Up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === files.length - 1}
                                    onClick={() => moveDown(idx)}
                                    className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-20"
                                    title="Move Down"
                                  >
                                    ↓
                                  </button>
                                </>
                              )}
                              <button onClick={() => removeFile(idx)} className="p-1 text-slate-400 hover:text-red-600 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                      </div>
                        );
                      })}
                </div>
              </div>

              {/* Configurations */}
              <div className="p-5 bg-slate-100/80 rounded-2xl space-y-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Tool Configuration</span>

                {tool.id === 'split-pdf' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">Split Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitMethod('every')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          splitMethod === 'every' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Split every page
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMethod('range')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          splitMethod === 'range' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Split by range
                      </button>
                    </div>
                    {splitMethod === 'range' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Page Ranges (e.g. 1-5, 8, 10)</label>
                        <input
                          type="text"
                          value={splitRange}
                          onChange={(e) => setSplitRange(e.target.value)}
                          placeholder="e.g. 1-5, 8, 10"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {tool.id === 'compress-pdf' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Compression Preset</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              setCompressionLevel(level);
                              setTargetKb('');
                            }}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition capitalize ${
                              compressionLevel === level && !targetKb ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Or Target Specific File Size (KB)
                      </label>
                      <input
                        type="number"
                        min={10}
                        placeholder="e.g. 33 (in KB)"
                        value={targetKb}
                        onChange={(e) => setTargetKb(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        SpikeDocs will automatically compress images and optimize streams to aim for your target size.
                      </span>
                    </div>
                  </div>
                )}

                {tool.id === 'page-numbers' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                      <select
                        value={pageNumberPosition}
                        onChange={(e: any) => setPageNumberPosition(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Number</label>
                      <input
                        type="number"
                        min={1}
                        value={pageNumberStart}
                        onChange={(e) => setPageNumberStart(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>
                )}

                {tool.id === 'html-to-pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Webpage URL</label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                )}

                {tool.id === 'watermark' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Watermark Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['text', 'confidential', 'draft'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setWatermarkType(t)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition capitalize ${
                              watermarkType === t ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {watermarkType === 'text' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Watermark Text</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. CONFIDENTIAL or COPYRIGHT"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Opacity ({watermarkOpacity}%)</label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseInt(e.target.value, 10))}
                          className="w-full accent-red-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Rotation Angle</label>
                        <select
                          value={watermarkRotation}
                          onChange={(e) => setWatermarkRotation(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                        >
                          <option value={45}>45° (Diagonal)</option>
                          <option value={0}>0° (Horizontal)</option>
                          <option value={90}>90° (Vertical)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {tool.id === 'pdf-to-jpg' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Image Resolution & Quality</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'high', label: 'High (300 DPI)' },
                        { id: 'medium', label: 'Medium (150 DPI)' },
                        { id: 'standard', label: 'Standard (72 DPI)' }
                      ].map(q => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setImageQuality(q.id as any)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                            imageQuality === q.id ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tool.id === 'jpg-to-pdf' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Page Size</label>
                      <select
                        value={pageSize}
                        onChange={(e: any) => setPageSize(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="A4">A4 (Standard)</option>
                        <option value="Letter">US Letter</option>
                        <option value="Fit">Fit to Image</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation</label>
                      <select
                        value={pageOrientation}
                        onChange={(e: any) => setPageOrientation(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                  </div>
                )}

                {tool.id === 'ocr-pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Document Language for OCR</label>
                    <select
                      value={ocrLang}
                      onChange={(e) => setOcrLang(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    >
                      <option value="eng">English</option>
                      <option value="spa">Spanish (Español)</option>
                      <option value="fra">French (Français)</option>
                      <option value="deu">German (Deutsch)</option>
                      <option value="yor">Yoruba</option>
                      <option value="hau">Hausa</option>
                      <option value="ibo">Igbo</option>
                    </select>
                  </div>
                )}

                {tool.id === 'repair-pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Repair Engine Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRepairMode('structure')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          repairMode === 'structure' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Rebuild Xref & Structure
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepairMode('stream')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          repairMode === 'stream' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Aggressive Stream Recovery
                      </button>
                    </div>
                  </div>
                )}

                {(['pdf-to-word', 'pdf-to-ppt', 'pdf-to-excel', 'word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-to-markdown', 'pdf-to-pdfa', 'edit-pdf', 'pdf-forms'].includes(tool.id)) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Conversion Layout & Typography</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConversionLayout('enhanced')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          conversionLayout === 'enhanced' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Preserve Precise Layout
                      </button>
                      <button
                        type="button"
                        onClick={() => setConversionLayout('standard')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                          conversionLayout === 'standard' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Standard Flow Formatting
                      </button>
                    </div>
                  </div>
                )}

                {tool.id === 'protect-pdf' && (
                  <div className="space-y-3">
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {tool.id === 'unlock-pdf' && (
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
                      <option value="English">English</option>
                      <option value="Yoruba">Yoruba</option>
                      <option value="Hausa">Hausa</option>
                      <option value="Igbo">Igbo</option>
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
