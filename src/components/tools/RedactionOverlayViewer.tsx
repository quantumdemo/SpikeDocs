"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { EyeOff, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { redactPDF } from '@/lib/engine/pdfEngine';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface RedactionOverlayViewerProps {
  file: File;
  onApplyRedaction: (redactedPdfBytes: Uint8Array) => void;
}

interface RedactBox {
  pageIndex: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export function RedactionOverlayViewer({ file, onApplyRedaction }: RedactionOverlayViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentDragBox, setCurrentDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

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
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentDragBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const w = Math.abs(currentX - startPos.x);
    const h = Math.abs(currentY - startPos.y);

    setCurrentDragBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentDragBox || !containerRef.current) return;
    setIsDrawing(false);

    const rect = containerRef.current.getBoundingClientRect();
    if (currentDragBox.w > 10 && currentDragBox.h > 10) {
      const xPct = (currentDragBox.x / rect.width) * 100;
      const yPct = (currentDragBox.y / rect.height) * 100;
      const widthPct = (currentDragBox.w / rect.width) * 100;
      const heightPct = (currentDragBox.h / rect.height) * 100;

      setBoxes(prev => [
        ...prev,
        {
          pageIndex: currentPage - 1,
          xPct,
          yPct,
          widthPct,
          heightPct,
        },
      ]);
    }
    setCurrentDragBox(null);
  };

  const removeBox = (index: number) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyRedactions = async () => {
    if (!pdfDoc || boxes.length === 0) return;

    const formattedRedactions = await Promise.all(
      boxes.map(async box => {
        const page = await pdfDoc.getPage(box.pageIndex + 1);
        const pageViewport = page.getViewport({ scale: 1.0 });

        const x = (box.xPct / 100) * pageViewport.width;
        const width = (box.widthPct / 100) * pageViewport.width;
        const height = (box.heightPct / 100) * pageViewport.height;
        const y = pageViewport.height - ((box.yPct / 100) * pageViewport.height) - height;

        return {
          pageIndex: box.pageIndex,
          x,
          y,
          width,
          height,
        };
      })
    );

    const redactedBytes = await redactPDF(file, formattedRedactions);
    onApplyRedaction(redactedBytes);
  };

  const currentPageBoxes = boxes.filter(b => b.pageIndex === currentPage - 1);

  return (
    <div className="w-full space-y-6">
      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
            <EyeOff className="w-4 h-4" />
            <span>Draw Black Box Over Sensitive Content</span>
          </span>
          <span className="text-xs font-bold text-slate-500">({boxes.length} Redactions Marked)</span>
        </div>

        {numPages > 1 && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= numPages) {
                    setCurrentPage(val);
                  }
                }}
                className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center bg-white text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
              />
              <span>of {numPages}</span>
            </div>
            <button
              disabled={currentPage === numPages}
              onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          disabled={boxes.length === 0}
          onClick={handleApplyRedactions}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${
            boxes.length > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Burn Redactions & Download</span>
        </button>
      </div>

      {/* Drawing Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative mx-auto border border-slate-300 rounded-2xl overflow-hidden shadow-md max-w-fit cursor-crosshair select-none bg-slate-200"
      >
        <canvas ref={canvasRef} className="block mx-auto" />

        {/* Existing Redaction Boxes */}
        {currentPageBoxes.map((box, idx) => (
          <div
            key={idx}
            style={{
              left: `${box.xPct}%`,
              top: `${box.yPct}%`,
              width: `${box.widthPct}%`,
              height: `${box.heightPct}%`,
            }}
            className="absolute bg-black border-2 border-red-500 flex items-center justify-center group shadow-md"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeBox(boxes.indexOf(box));
              }}
              className="p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
              title="Remove Redaction"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Active Drag Rectangle */}
        {currentDragBox && (
          <div
            style={{
              left: `${currentDragBox.x}px`,
              top: `${currentDragBox.y}px`,
              width: `${currentDragBox.w}px`,
              height: `${currentDragBox.h}px`,
            }}
            className="absolute bg-black/80 border-2 border-red-500 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
