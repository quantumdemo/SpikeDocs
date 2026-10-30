"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { SignatureModal } from './SignatureModal';
import { PenTool, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Signature Overlay State (percentage based position)
  const [sigPosition, setSigPosition] = useState({ x: 30, y: 40, width: 25, height: 12 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, startW: 25, startH: 12 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }
    renderPage();
  }, [pdfDoc, currentPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!signatureDataUrl) return;
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseYPct = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({ x: mouseXPct - sigPosition.x, y: mouseYPct - sigPosition.y });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: sigPosition.width,
      startH: sigPosition.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isResizing) {
      const deltaXPct = ((e.clientX - resizeStart.mouseX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - resizeStart.mouseY) / rect.height) * 100;

      const newWidth = Math.max(5, Math.min(100 - sigPosition.x, resizeStart.startW + deltaXPct));
      const newHeight = Math.max(3, Math.min(100 - sigPosition.y, resizeStart.startH + deltaYPct));

      setSigPosition(prev => ({ ...prev, width: newWidth, height: newHeight }));
      return;
    }

    if (isDragging) {
      const mouseXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseYPct = ((e.clientY - rect.top) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - sigPosition.width, mouseXPct - dragOffset.x));
      const newY = Math.max(0, Math.min(100 - sigPosition.height, mouseYPct - dragOffset.y));

      setSigPosition(prev => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
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
      {/* Controls Bar */}
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

      {/* PDF Page Canvas with Draggable Signature Overlay */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative mx-auto border border-slate-300 rounded-2xl overflow-hidden shadow-md max-w-fit select-none bg-slate-200"
      >
        <canvas ref={canvasRef} className="block mx-auto" />

        {signatureDataUrl && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              left: `${sigPosition.x}%`,
              top: `${sigPosition.y}%`,
              width: `${sigPosition.width}%`,
              height: `${sigPosition.height}%`,
            }}
            className="absolute border-2 border-dashed border-red-500 bg-red-50/20 rounded-lg cursor-move flex items-center justify-center p-1 group shadow-lg"
          >
            <img src={signatureDataUrl} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none" />
            <span className="absolute -top-6 left-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              Drag to position / Resize
            </span>
            {/* Resize handle */}
            <div
              onMouseDown={handleResizeStart}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-red-600 border-2 border-white rounded-full cursor-se-resize hover:scale-125 transition-transform"
            />
          </div>
        )}
      </div>

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
