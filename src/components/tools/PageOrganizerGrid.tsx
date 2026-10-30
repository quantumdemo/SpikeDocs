"use client";

import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { RotateCw, Trash2, Check, RefreshCw } from 'lucide-react';
import { organizePDF, extractPages, rotatePDF } from '@/lib/engine/pdfEngine';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PageOrganizerGridProps {
  file: File;
  mode: 'organize' | 'extract' | 'rotate';
  onSave: (processedBytes: Uint8Array) => void;
}

interface PageThumbnail {
  originalIndex: number;
  dataUrl: string;
  rotation: number;
}

export function PageOrganizerGrid({ file, mode, onSave }: PageOrganizerGridProps) {
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadThumbnails() {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const loadedPages: PageThumbnail[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          loadedPages.push({
            originalIndex: i - 1,
            dataUrl: canvas.toDataURL('image/png'),
            rotation: 0,
          });
        }
      }

      setPages(loadedPages);
      setSelectedIndexes(loadedPages.map(p => p.originalIndex));
      setLoading(false);
    }

    loadThumbnails();
  }, [file]);

  const toggleSelectPage = (index: number) => {
    if (selectedIndexes.includes(index)) {
      setSelectedIndexes(prev => prev.filter(i => i !== index));
    } else {
      setSelectedIndexes(prev => [...prev, index]);
    }
  };

  const handleDeletePage = (index: number) => {
    setPages(prev => prev.filter(p => p.originalIndex !== index));
    setSelectedIndexes(prev => prev.filter(i => i !== index));
  };

  const handleRotatePage = (index: number) => {
    setPages(prev =>
      prev.map(p => (p.originalIndex === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    setPages(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIdx, 1);
      updated.splice(idx, 0, movedItem);
      return updated;
    });
    setDraggedIdx(idx);
  };

  const handleApplyChanges = async () => {
    if (mode === 'extract') {
      const bytes = await extractPages(file, selectedIndexes);
      onSave(bytes);
    } else if (mode === 'rotate') {
      const bytes = await rotatePDF(file, 90);
      onSave(bytes);
    } else {
      const newOrder = pages.map(p => p.originalIndex);
      const bytes = await organizePDF(file, newOrder);
      onSave(bytes);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Rendering page thumbnails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-slate-700">
          Total Pages: {pages.length} {mode === 'extract' && `(${selectedIndexes.length} selected)`}
        </span>
        <button
          onClick={handleApplyChanges}
          disabled={pages.length === 0}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes & Download</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pages.map((page, idx) => {
          const isSelected = selectedIndexes.includes(page.originalIndex);
          return (
            <div
              key={page.originalIndex}
              draggable={mode === 'organize'}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onClick={() => mode === 'extract' && toggleSelectPage(page.originalIndex)}
              className={`relative bg-white border-2 rounded-2xl p-3 flex flex-col items-center transition cursor-pointer shadow-xs group ${
                mode === 'extract' && isSelected ? 'border-red-600 bg-red-50/20 ring-2 ring-red-500/20' : 'border-slate-200 hover:border-red-300'
              } ${draggedIdx === idx ? 'opacity-50 scale-95 border-dashed border-red-500' : ''}`}
            >
              <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10">
                Page {idx + 1}
              </span>

              <div className="relative my-2 overflow-hidden flex items-center justify-center min-h-[140px]">
                <img
                  src={page.dataUrl}
                  alt={`Page ${idx + 1}`}
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                  className="max-h-36 object-contain rounded shadow-xs transition-transform duration-200"
                />
              </div>

              {/* Page Controls */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleRotatePage(page.originalIndex)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100"
                  title="Rotate Left"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePage(page.originalIndex)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100"
                  title="Delete Page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
