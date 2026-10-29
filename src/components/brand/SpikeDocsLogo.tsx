import React from 'react';

export function SpikeDocsLogo({ className = "h-8 w-8", textClassName = "text-xl font-bold" }: { className?: string; textClassName?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className={`relative flex items-center justify-center bg-red-600 text-white rounded-lg p-1.5 shadow-md shadow-red-500/20 ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-6" />
          <path d="m9 15 3-3 3 3" />
        </svg>
      </div>
      <span className={`tracking-tight font-extrabold text-slate-900 ${textClassName}`}>
        Spike<span className="text-red-600">Docs</span>
      </span>
    </div>
  );
}
