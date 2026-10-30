"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { SignatureModal } from './SignatureModal';
import { PenTool, Trash2, Check, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sliders } from 'lucide-react';
import { signPDF } from '@/lib/engine/pdfEngine';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfSignatureViewerProps {
  file: File;
  onApplySignature: (signedPdfBytes: Uint8Array) => void;
}

export function PdfSignatureViewer({ file, onApplySignature }: PdfSignatureViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Zoom & Panning State
  const [scale, setScale] = useState<number>(1.2);
  const [nudgeStep, setNudgeStep] = useState<number>(1); // 1px (Fine), 5px (Medium), 10px (Fast)

  // Signature Overlay State (percentage based position)
  const [sigPosition, setSigPosition] = useState({ x: 30, y: 40, width: 25, height: 12 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, startW: 25, startH: 12 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPdf() {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    }
    loadPdf();
  }, [file]);

  useEffect(() => {
    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }
    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | PointerEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!signatureDataUrl || !containerRef.current) return;
    setIsDragging(true);
    const coords = getClientCoords(e);
    const rect = containerRef.current.getBoundingClientRect();
    const mouseXPct = ((coords.clientX - rect.left) / rect.width) * 100;
    const mouseYPct = ((coords.clientY - rect.top) / rect.height) * 100;
    setDragOffset({ x: mouseXPct - sigPosition.x, y: mouseYPct - sigPosition.y });
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const coords = getClientCoords(e);
    setResizeStart({
      mouseX: coords.clientX,
      mouseY: coords.clientY,
      startW: sigPosition.width,
      startH: sigPosition.height,
    });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const coords = getClientCoords(e);

    if (isResizing) {
      const deltaXPct = ((coords.clientX - resizeStart.mouseX) / rect.width) * 100;
      const deltaYPct = ((coords.clientY - resizeStart.mouseY) / rect.height) * 100;

      const newWidth = Math.max(5, Math.min(100 - sigPosition.x, resizeStart.startW + deltaXPct));
      const newHeight = Math.max(3, Math.min(100 - sigPosition.y, resizeStart.startH + deltaYPct));

      setSigPosition(prev => ({ ...prev, width: newWidth, height: newHeight }));
      return;
    }

    if (isDragging) {
      const mouseXPct = ((coords.clientX - rect.left) / rect.width) * 100;
      const mouseYPct = ((coords.clientY - rect.top) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - sigPosition.width, mouseXPct - dragOffset.x));
      const newY = Math.max(0, Math.min(100 - sigPosition.height, mouseYPct - dragOffset.y));

      setSigPosition(prev => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Nudge Control handlers (Arrow Keys with configurable increment)
  const handleNudge = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPxStepPct = (nudgeStep / rect.width) * 100;
    const yPxStepPct = (nudgeStep / rect.height) * 100;

    setSigPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      if (direction === 'left') newX = Math.max(0, prev.x - xPxStepPct);
      if (direction === 'right') newX = Math.min(100 - prev.width, prev.x + xPxStepPct);
      if (direction === 'up') newY = Math.max(0, prev.y - yPxStepPct);
      if (direction === 'down') newY = Math.min(100 - prev.height, prev.y + yPxStepPct);
      return { ...prev, x: newX, y: newY };
    });
  };

  const handleSaveSignature = async () => {
    if (!signatureDataUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const page = await pdfDoc.getPage(currentPage);
    const pageViewport = page.getViewport({ scale: 1.0 });

    // Calculate actual PDF coordinates (PDF Y-axis starts from bottom)
    const pdfX = (sigPosition.x / 100) * pageViewport.width;
    const pdfWidth = (sigPosition.width / 100) * pageViewport.width;
    const pdfHeight = (sigPosition.height / 100) * pageViewport.height;
    const pdfY = pageViewport.height - ((sigPosition.y / 100) * pageViewport.height) - pdfHeight;

    const signedBytes = await signPDF(
      file,
      signatureDataUrl,
      currentPage - 1,
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight
    );

    onApplySignature(signedBytes);
  };

  return (
    <div className="w-full space-y-6">
      {/* Controls Bar (Top) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-red-700 flex items-center gap-1.5"
          >
            <PenTool className="w-4 h-4" />
            <span>{signatureDataUrl ? 'Change Signature' : 'Add Signature'}</span>
          </button>
          {signatureDataUrl && (
            <button
              onClick={() => setSignatureDataUrl(null)}
              className="p-2 bg-white text-slate-500 hover:text-red-600 rounded-xl border border-slate-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <button
            onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
            className="p-1 hover:text-red-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span>{Math.round((scale / 1.2) * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
            className="p-1 hover:text-red-600"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Page selector */}
        {numPages > 1 && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {currentPage} of {numPages}</span>
            <button
              disabled={currentPage === numPages}
              onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          disabled={!signatureDataUrl}
          onClick={handleSaveSignature}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${
            signatureDataUrl
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Apply Signature & Download</span>
        </button>
      </div>

      {/* PDF Scroll & Pan Container */}
      <div
        ref={scrollWrapperRef}
        className="w-full max-h-[60vh] sm:max-h-[70vh] overflow-auto border border-slate-300 rounded-2xl p-4 bg-slate-200 touch-pan-x touch-pan-y"
      >
        <div
          ref={containerRef}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="relative mx-auto border border-slate-400 rounded-xl overflow-hidden shadow-lg max-w-fit select-none bg-white"
        >
          <canvas ref={canvasRef} className="block mx-auto" />

          {signatureDataUrl && (
            <div
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              style={{
                left: `${sigPosition.x}%`,
                top: `${sigPosition.y}%`,
                width: `${sigPosition.width}%`,
                height: `${sigPosition.height}%`,
              }}
              className="absolute border-2 border-dashed border-red-500 bg-red-50/20 rounded-lg cursor-move flex items-center justify-center p-1 group shadow-lg touch-none"
            >
              <img src={signatureDataUrl} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none" />
              <span className="absolute -top-6 left-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none whitespace-nowrap">
                Drag to position / Resize
              </span>
              {/* Touch-Friendly Corner Resize handle */}
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-600 border-2 border-white rounded-full cursor-se-resize flex items-center justify-center shadow-md hover:scale-125 transition-transform touch-none"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Precision Nudge Toolbar (Bottom Controls) */}
      {signatureDataUrl && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Nudge Speed:</span>
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setNudgeStep(1)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  nudgeStep === 1 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fine (1px)
              </button>
              <button
                onClick={() => setNudgeStep(5)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  nudgeStep === 5 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Medium (5px)
              </button>
              <button
                onClick={() => setNudgeStep(10)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  nudgeStep === 10 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fast (10px)
              </button>
            </div>
          </div>

          {/* D-Pad Arrow Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleNudge('left')}
              className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl text-white font-bold transition shadow-xs"
              title="Move Left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleNudge('up')}
                className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl text-white font-bold transition shadow-xs"
                title="Move Up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNudge('down')}
                className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl text-white font-bold transition shadow-xs"
                title="Move Down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handleNudge('right')}
              className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl text-white font-bold transition shadow-xs"
              title="Move Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSignature={(dataUrl) => {
          setSignatureDataUrl(dataUrl);
        }}
      />
    </div>
  );
}
