"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Type, Square, Circle, Image as ImageIcon, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfEditorViewerProps {
  file: File;
  mode?: 'edit' | 'forms';
  onSave: (editedPdfBytes: Uint8Array) => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'field';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  fontSize?: number;
  imageDataUrl?: string;
}

export function PdfEditorViewer({ file, mode = 'edit', onSave }: PdfEditorViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const [elements, setElements] = useState<Record<number, CanvasElement[]>>({});
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [activeColor, setActiveColor] = useState<string>('#000000');
  const [activeFontSize, setActiveFontSize] = useState<number>(14);

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

  const addTextElement = () => {
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 30,
      y: 30,
      width: 35,
      height: 8,
      text: 'Type text here...',
      color: activeColor,
      fontSize: activeFontSize,
    };
    setElements(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  const addShapeElement = (shape: 'rect' | 'circle') => {
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type: shape,
      x: 35,
      y: 35,
      width: 25,
      height: 15,
      color: activeColor,
    };
    setElements(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  const addFormField = (fieldType: string) => {
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type: 'field',
      x: 30,
      y: 30,
      width: 40,
      height: 6,
      text: fieldType === 'checkbox' ? '[  ] Checkbox' : 'Fillable Form Field...',
      color: '#1d4ed8',
    };
    setElements(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newEl: CanvasElement = {
            id: Date.now().toString(),
            type: 'image',
            x: 25,
            y: 25,
            width: 30,
            height: 25,
            imageDataUrl: event.target.result as string,
          };
          setElements(prev => ({
            ...prev,
            [currentPage]: [...(prev[currentPage] || []), newEl],
          }));
          setSelectedElementId(newEl.id);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removeElement = (id: string) => {
    setElements(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).filter(el => el.id !== id),
    }));
    setSelectedElementId(null);
  };

  const handleSaveDocument = async () => {
    const fileBytes = await file.arrayBuffer();
    const pdfDocLib = await PDFDocument.load(fileBytes);
    const font = await pdfDocLib.embedFont(StandardFonts.Helvetica);

    for (let pNum = 1; pNum <= pdfDocLib.getPageCount(); pNum++) {
      const pageElements = elements[pNum] || [];
      const page = pdfDocLib.getPage(pNum - 1);
      const { width: pWidth, height: pHeight } = page.getSize();

      for (const el of pageElements) {
        const x = (el.x / 100) * pWidth;
        const width = (el.width / 100) * pWidth;
        const height = (el.height / 100) * pHeight;
        const y = pHeight - ((el.y / 100) * pHeight) - height;

        if (el.type === 'text' || el.type === 'field') {
          page.drawText(el.text || '', {
            x,
            y,
            size: el.fontSize || 12,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        } else if (el.type === 'rect') {
          page.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: rgb(0.2, 0.2, 0.8),
            borderWidth: 1.5,
          });
        } else if (el.type === 'circle') {
          page.drawEllipse({
            x: x + width / 2,
            y: y + height / 2,
            xScale: width / 2,
            yScale: height / 2,
            borderColor: rgb(0.8, 0.2, 0.2),
            borderWidth: 1.5,
          });
        } else if (el.type === 'image' && el.imageDataUrl) {
          const imgBytes = await fetch(el.imageDataUrl).then(r => r.arrayBuffer());
          const embedded = await pdfDocLib.embedPng(imgBytes);
          page.drawImage(embedded, { x, y, width, height });
        }
      }
    }

    const savedBytes = await pdfDocLib.save();
    onSave(savedBytes);
  };

  const currentElements = elements[currentPage] || [];

  return (
    <div className="w-full space-y-6">
      {/* Editor Action Toolbar */}
      <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'edit' ? (
            <>
              <button
                type="button"
                onClick={addTextElement}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Type className="w-4 h-4 text-red-600" />
                <span>Add Text</span>
              </button>
              <button
                type="button"
                onClick={() => addShapeElement('rect')}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Square className="w-4 h-4 text-blue-600" />
                <span>Rectangle</span>
              </button>
              <button
                type="button"
                onClick={() => addShapeElement('circle')}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Circle className="w-4 h-4 text-emerald-600" />
                <span>Circle</span>
              </button>
              <label className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Place Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => addFormField('text')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>+ Text Field</span>
              </button>
              <button
                type="button"
                onClick={() => addFormField('checkbox')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>+ Checkbox</span>
              </button>
            </>
          )}
        </div>

        {/* Page Selector */}
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
          onClick={handleSaveDocument}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes & Download</span>
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="w-full max-h-[65vh] overflow-x-auto overflow-y-auto border border-slate-300 rounded-2xl p-4 bg-slate-200 text-center">
        <div
          ref={containerRef}
          className="relative inline-block text-left border border-slate-400 rounded-xl overflow-hidden shadow-lg select-none bg-white"
        >
          <canvas ref={canvasRef} className="block" />

          {/* Rendered Elements */}
          {currentElements.map((el) => (
            <div
              key={el.id}
              onClick={() => setSelectedElementId(el.id)}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
              }}
              className={`absolute border-2 rounded-lg p-1 flex items-center justify-between cursor-move shadow-md bg-white/70 ${
                selectedElementId === el.id ? 'border-red-600 ring-2 ring-red-400' : 'border-slate-400'
              }`}
            >
              {el.type === 'text' || el.type === 'field' ? (
                <input
                  type="text"
                  value={el.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setElements(prev => ({
                      ...prev,
                      [currentPage]: prev[currentPage].map(item => item.id === el.id ? { ...item, text: val } : item),
                    }));
                  }}
                  className="w-full h-full bg-transparent text-xs font-semibold outline-none px-1"
                />
              ) : el.type === 'rect' ? (
                <div className="w-full h-full border-2 border-blue-600 rounded" />
              ) : el.type === 'circle' ? (
                <div className="w-full h-full border-2 border-red-600 rounded-full" />
              ) : el.type === 'image' && el.imageDataUrl ? (
                <img src={el.imageDataUrl} alt="Inserted" className="w-full h-full object-contain pointer-events-none" />
              ) : null}

              {selectedElementId === el.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(el.id);
                  }}
                  className="absolute -top-3 -right-3 p-1 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
