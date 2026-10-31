"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Crop, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cropPDF } from '@/lib/engine/pdfEngine';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfCropViewerProps {
  file: File;
  onApplyCrop: (croppedPdfBytes: Uint8Array) => void;
}

export function PdfCropViewer({ file, onApplyCrop }: PdfCropViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Bounding crop box percentage states
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, startW: 80, startH: 80 });

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

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const mouseXPct = ((clientX - rect.left) / rect.width) * 100;
    const mouseYPct = ((clientY - rect.top) / rect.height) * 100;
    setDragOffset({ x: mouseXPct - cropBox.x, y: mouseYPct - cropBox.y });
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizeStart({
      mouseX: clientX,
      mouseY: clientY,
      startW: cropBox.width,
      startH: cropBox.height,
    });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isResizing) {
      const deltaXPct = ((clientX - resizeStart.mouseX) / rect.width) * 100;
      const deltaYPct = ((clientY - resizeStart.mouseY) / rect.height) * 100;
      const newWidth = Math.max(10, Math.min(100 - cropBox.x, resizeStart.startW + deltaXPct));
      const newHeight = Math.max(10, Math.min(100 - cropBox.y, resizeStart.startH + deltaYPct));
      setCropBox(prev => ({ ...prev, width: newWidth, height: newHeight }));
      return;
    }

    if (isDragging) {
      const mouseXPct = ((clientX - rect.left) / rect.width) * 100;
      const mouseYPct = ((clientY - rect.top) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100 - cropBox.width, mouseXPct - dragOffset.x));
      const newY = Math.max(0, Math.min(100 - cropBox.height, mouseYPct - dragOffset.y));
      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleSaveCrop = async () => {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(currentPage);
    const pageViewport = page.getViewport({ scale: 1.0 });

    const cropX = (cropBox.x / 100) * pageViewport.width;
    const cropWidth = (cropBox.width / 100) * pageViewport.width;
    const cropHeight = (cropBox.height / 100) * pageViewport.height;
    const cropY = pageViewport.height - ((cropBox.y / 100) * pageViewport.height) - cropHeight;

    const croppedBytes = await cropPDF(file, {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    });

    onApplyCrop(croppedBytes);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
            <Crop className="w-4 h-4" />
            <span>Drag Edges to Crop Area</span>
          </span>
          <span className="text-xs font-bold text-slate-500">
            ({Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%)
          </span>
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
          onClick={handleSaveCrop}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
        >
          <Check className="w-4 h-4" />
          <span>Apply Crop to All Pages & Download</span>
        </button>
      </div>

      <div className="w-full max-h-[65vh] overflow-x-auto overflow-y-auto border border-slate-300 rounded-2xl p-4 bg-slate-200 text-center">
        <div
          ref={containerRef}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="relative inline-block text-left border border-slate-400 rounded-xl overflow-hidden shadow-lg select-none bg-white"
        >
          <canvas ref={canvasRef} className="block" />

          {/* Draggable & Resizable Bounding Box */}
          <div
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`,
            }}
            className="absolute border-2 border-red-600 bg-red-500/10 shadow-2xl cursor-move touch-none"
          >
            <span className="absolute -top-6 left-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
              Crop Boundary
            </span>

            {/* Bottom-right resize handle */}
            <div
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-600 border-2 border-white rounded-full cursor-se-resize flex items-center justify-center shadow-md hover:scale-125 transition-transform touch-none"
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
