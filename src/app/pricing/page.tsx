"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Shield, Zap, Globe } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      {/* Pricing Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Simple & Transparent Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Choose the Right Plan for Your Workflow
        </h1>
        <p className="text-slate-600 text-base sm:text-lg">
          Zero-data retention processing. Process unlimited files with lightning-fast browser AI and WASM engines.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 pt-6">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors relative"
          >
            <div className={`w-6 h-6 bg-red-600 rounded-full shadow-md transition-transform transform ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
          <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Yearly <span className="text-red-600 font-extrabold">(Save 25%)</span>
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">$0</span>
              <span className="text-xs text-slate-500">/ forever</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Essential PDF utilities for personal or occasional document editing.
            </p>
            <ul className="space-y-3 pt-4 text-xs font-medium text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Up to 5 file conversions per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Maximum file size 50MB</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Access to Basic Tools (Merge, Split, Rotate, Edit)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 line-through">
                <span>Advanced AI Summarizer & AI Translation</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 line-through">
                <span>Batch processing unlimited files</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition block"
          >
            Start Free
          </Link>
        </div>

        {/* Pro Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative border-2 border-red-600 flex flex-col justify-between space-y-6">
          <div className="absolute -top-3.5 right-8 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Pro Unlimited</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">
                {billingCycle === 'monthly' ? '$9.99' : '$89.99'}
              </span>
              <span className="text-xs text-slate-400">
                {billingCycle === 'monthly' ? '/ month' : '/ year'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unrestricted access to all AI tools, WASM heavy engines, batching, and unlimited daily uploads.
            </p>
            <ul className="space-y-3 pt-4 text-xs font-medium text-slate-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-500 shrink-0" />
                <span>Unlimited file conversions per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-500 shrink-0" />
                <span>Unlimited file sizes (&gt; 50MB)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-500 shrink-0" />
                <span>Full access to AI Summarizer & AI Translation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-500 shrink-0" />
                <span>WebAssembly OCR Searchable PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-500 shrink-0" />
                <span>Batch Processing multiple files at once</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link
              href="/auth/signup"
              className="w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/30 transition block"
            >
              Upgrade to Pro (Pay via Stripe or Paystack)
            </Link>
            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Stripe (Global)</span>
              <span>•</span>
              <span>Paystack (Nigeria / Africa)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
