"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Stamp, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { addWatermark } from '@/lib/engine/pdfEngine';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfWatermarkViewerProps {
  file: File;
  onApplyWatermark: (watermarkedPdfBytes: Uint8Array) => void;
}

export function PdfWatermarkViewer({ file, onApplyWatermark }: PdfWatermarkViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Watermark Customization State
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [color, setColor] = useState<string>('#b91c1c'); // Red default, customizable
  const [opacity, setOpacity] = useState<number>(35);
  const [rotation, setRotation] = useState<number>(45);
  const [fontSize, setFontSize] = useState<number>(36);

  // Position percentage
  const [position, setPosition] = useState({ x: 30, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    setDragOffset({ x: mouseXPct - position.x, y: mouseYPct - position.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const mouseXPct = ((clientX - rect.left) / rect.width) * 100;
    const mouseYPct = ((clientY - rect.top) / rect.height) * 100;
    const newX = Math.max(0, Math.min(85, mouseXPct - dragOffset.x));
    const newY = Math.max(0, Math.min(85, mouseYPct - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleApply = async () => {
    const bytes = await addWatermark(file, text || 'CONFIDENTIAL', opacity / 100);
    onApplyWatermark(bytes);
  };

  return (
    <div className="w-full space-y-6">
      {/* Controls & Customization Toolbar */}
      <div className="bg-slate-100 p-5 rounded-3xl border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stamp className="w-5 h-5 text-red-600" />
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Live Watermark Stamping</span>
          </div>

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
            onClick={handleApply}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Watermark & Download</span>
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Watermark Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type watermark text..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Ink Color</label>
            <div className="flex items-center gap-2 pt-1">
              {['#b91c1c', '#1d4ed8', '#15803d', '#000000', '#6b7280'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-red-500 scale-110' : 'opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Opacity ({opacity}%)</label>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
              className="w-full accent-red-600 pt-1"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Rotation Angle</label>
            <select
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
            >
              <option value={45}>45° (Diagonal)</option>
              <option value={0}>0° (Horizontal)</option>
              <option value={90}>90° (Vertical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview Container with Draggable Watermark */}
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

          {/* Draggable Watermark Overlay */}
          <div
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `rotate(${rotation}deg)`,
              opacity: opacity / 100,
              color: color,
            }}
            className="absolute border border-dashed border-red-500/50 p-2 cursor-move font-black tracking-widest whitespace-nowrap select-none touch-none text-2xl sm:text-4xl"
          >
            {text || 'CONFIDENTIAL'}
          </div>
        </div>
      </div>
    </div>
  );
}
