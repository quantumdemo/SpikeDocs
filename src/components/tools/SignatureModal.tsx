"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, PenTool, Type, Image as ImageIcon, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export function SignatureModal({ isOpen, onClose, onSaveSignature }: SignatureModalProps) {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [typedFont, setTypedFont] = useState<'cursive' | 'serif' | 'sans-serif'>('cursive');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (tab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [tab, isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx?.beginPath();
    ctx?.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx?.lineTo(clientX - rect.left, clientY - rect.top);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (tab === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl);
      onClose();
    } else if (tab === 'type' && typedName.trim()) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 150;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.font = typedFont === 'cursive' ? '40px Dancing Script, cursive, sans-serif' : '36px Georgia, serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 75);
      }
      onSaveSignature(tempCanvas.toDataURL('image/png'));
      onClose();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSaveSignature(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-lg">Create e-Signature</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1">
          <button
            onClick={() => setTab('draw')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              tab === 'draw' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" /> Draw
          </button>
          <button
            onClick={() => setTab('type')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              tab === 'type' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" /> Type
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              tab === 'upload' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Upload
          </button>
        </div>

        <div className="p-6">
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/80">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none rounded-2xl"
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 shadow-xs text-xs font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Draw your signature with your mouse or finger.</p>
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type your full name..."
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-2 focus:ring-red-500 outline-none"
              />
              <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50 text-center min-h-[100px] flex items-center justify-center">
                <span className={`text-3xl text-slate-900 ${typedFont === 'cursive' ? 'font-serif italic' : 'font-sans'}`}>
                  {typedName || 'Your Signature'}
                </span>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50">
              <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" id="sig-upload" />
              <label htmlFor="sig-upload" className="cursor-pointer space-y-2 inline-block">
                <ImageIcon className="w-8 h-8 text-red-600 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">Click to upload signature image</span>
                <span className="text-[11px] text-slate-400 block">PNG with transparent background recommended</span>
              </label>
            </div>
          )}
        </div>

        {tab !== 'upload' && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-red-700 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Signature
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
