"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TOOL_CATEGORIES, TOOLS_CONFIG } from '@/config/tools';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle,
  FileCheck
} from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [categoryParam]);

  const filteredTools = TOOLS_CONFIG.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-12 px-4 sm:px-8 text-center bg-gradient-to-b from-red-50/60 via-slate-50 to-slate-50 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Privacy Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 shadow-sm rounded-full text-xs font-bold text-red-600">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Zero-Data Retention • Pure Browser In-Memory Processing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Every PDF Tool You Need, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
              100% Private & In Browser
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            SpikeDocs provides 30+ document utilities that process your files strictly inside your browser memory. Your confidential documents never leave your computer.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tools (e.g., Merge PDF, Compress, PDF to Word, OCR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-medium shadow-lg shadow-slate-200/50 focus:ring-2 focus:ring-red-500 outline-none text-sm sm:text-base transition"
              />
            </div>
          </div>

          {/* Value Props Pills */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Free 5 files/day
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Fast WASM & AI
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> PWA Desktop & Mobile
            </span>
          </div>
        </div>
      </section>

      {/* TOOLS CATEGORIES & GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Tools ({TOOLS_CONFIG.length})
          </button>
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/${tool.slug}`}
              className="group bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-red-300 hover:shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
            >
              {tool.isPro && (
                <span className="absolute top-4 right-4 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> PRO
                </span>
              )}

              <div>
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors duration-200 shadow-xs">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-red-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-600">
                <span>Use Tool</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY SPIKEDOCS / PRIVACY PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-red-500">
                Privacy-First Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Why "Zero-Data Retention" Matters
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Traditional online converters upload your sensitive contracts, financial statements, and personal records to third-party cloud servers. SpikeDocs completely eliminates that vulnerability by executing PDF parsing, rendering, and WebAssembly OCR directly in your browser.
              </p>
              <div className="space-y-3 pt-2 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Files stay on your local device RAM</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>No server uploads or temporary storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Works offline as an installed Progressive Web App</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="font-bold text-lg text-white">Compare Privacy Models</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-200">
                  <span className="font-bold block text-red-400 mb-0.5">Traditional Web Converters</span>
                  Uploads file -&gt; Stores on Cloud Server -&gt; Processes -&gt; Downloads
                </div>
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200">
                  <span className="font-bold block text-emerald-400 mb-0.5">SpikeDocs PWA Engine</span>
                  Selects file -&gt; Browser In-Memory Processing -&gt; Downloads instantly
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-slate-500">Loading SpikeDocs...</div>}>
      <HomeContent />
    </Suspense>
  );
}
