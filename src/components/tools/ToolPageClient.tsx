"use client";

import React from 'react';
import { notFound } from 'next/navigation';
import { getToolBySlug, TOOLS_CONFIG, TOOL_CATEGORIES } from '@/config/tools';
import { ToolProcessor } from '@/components/tools/ToolProcessor';
import {
  mergePDFs,
  splitPDF,
  extractPages,
  organizePDF,
  rotatePDF,
  compressPDF,
  repairPDF,
  addPageNumbers,
  addWatermark,
  protectPDF,
  unlockPDF,
  redactPDF,
  jpgToPdf,
  pdfToWord,
  wordToPdf,
  pdfToExcel,
  excelToPdf,
  pdfToMarkdown,
  pdfToPdfA,
  runOcrOnImage,
  generateAISummary,
  translateText,
  extractTextFromPDF
} from '@/lib/engine/pdfEngine';
import Link from 'next/link';
import { Shield, Sparkles, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export function ToolPageClient({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const handleProcessTool = async (files: File[], options: Record<string, any>) => {
    let outputBytes: Uint8Array | null = null;
    let outputBlob: Blob | null = null;
    let textOutput: string | undefined = undefined;
    let fileName = `spikedocs_${tool.slug}_result`;

    switch (tool.id) {
      case 'merge-pdf':
        outputBytes = await mergePDFs(files);
        fileName += '.pdf';
        break;

      case 'split-pdf':
        const splitRes = await splitPDF(files[0], options.splitRange || '1');
        outputBytes = splitRes[0].bytes;
        fileName = splitRes[0].name;
        break;

      case 'extract-pdf':
        outputBytes = await extractPages(files[0], [0]);
        fileName += '.pdf';
        break;

      case 'organize-pdf':
        outputBytes = await organizePDF(files[0], [0]);
        fileName += '.pdf';
        break;

      case 'rotate-pdf':
        outputBytes = await rotatePDF(files[0], 90);
        fileName += '.pdf';
        break;

      case 'compress-pdf':
        outputBytes = await compressPDF(files[0], 'medium');
        fileName += '.pdf';
        break;

      case 'repair-pdf':
        outputBytes = await repairPDF(files[0]);
        fileName += '.pdf';
        break;

      case 'page-numbers':
        outputBytes = await addPageNumbers(files[0], 'bottom-center');
        fileName += '.pdf';
        break;

      case 'watermark':
        outputBytes = await addWatermark(files[0], options.watermarkText || 'CONFIDENTIAL');
        fileName += '.pdf';
        break;

      case 'protect-pdf':
        outputBytes = await protectPDF(files[0], options.password || 'SpikeDocs123');
        fileName += '.pdf';
        break;

      case 'unlock-pdf':
        outputBytes = await unlockPDF(files[0], options.password || '');
        fileName += '.pdf';
        break;

      case 'redact-pdf':
        outputBytes = await redactPDF(files[0], [{ pageIndex: 0, x: 50, y: 50, width: 200, height: 30 }]);
        fileName += '.pdf';
        break;

      case 'jpg-to-pdf':
        outputBytes = await jpgToPdf(files);
        fileName += '.pdf';
        break;

      case 'pdf-to-word': {
        const pageTexts = await extractTextFromPDF(files[0]);
        outputBlob = await pdfToWord(files[0], pageTexts);
        fileName += '.docx';
        break;
      }

      case 'word-to-pdf': {
        const wordText = await files[0].text();
        outputBytes = await wordToPdf(files[0], wordText || "Sample converted document content");
        fileName += '.pdf';
        break;
      }

      case 'pdf-to-excel': {
        const pageTexts = await extractTextFromPDF(files[0]);
        outputBytes = await pdfToExcel(files[0], pageTexts);
        fileName += '.xlsx';
        break;
      }

      case 'excel-to-pdf':
        outputBytes = await excelToPdf(files[0]);
        fileName += '.pdf';
        break;

      case 'pdf-to-markdown': {
        const pageTexts = await extractTextFromPDF(files[0]);
        textOutput = await pdfToMarkdown(files[0], pageTexts);
        outputBlob = new Blob([textOutput], { type: 'text/markdown' });
        fileName += '.md';
        break;
      }

      case 'pdf-to-pdfa':
        outputBytes = await pdfToPdfA(files[0]);
        fileName += '.pdf';
        break;

      case 'ocr-pdf':
        textOutput = await runOcrOnImage(files[0]);
        outputBlob = new Blob([textOutput], { type: 'text/plain' });
        fileName += '_ocr.txt';
        break;

      case 'ai-summarizer': {
        const pageTexts = await extractTextFromPDF(files[0]);
        const fullText = pageTexts.join(' ');
        textOutput = await generateAISummary(fullText || "Sample document content to summarize.", options.summaryStyle);
        outputBlob = new Blob([textOutput], { type: 'text/markdown' });
        fileName += '_summary.md';
        break;
      }

      case 'translate-pdf': {
        const pageTexts = await extractTextFromPDF(files[0]);
        const fullText = pageTexts.join(' ');
        textOutput = await translateText(fullText || "Original Document Content", options.targetLang || 'Spanish');
        outputBlob = new Blob([textOutput], { type: 'text/plain' });
        fileName += `_translated_${options.targetLang}.txt`;
        break;
      }

      default:
        outputBytes = await compressPDF(files[0]);
        fileName += '.pdf';
        break;
    }

    const finalBlob = outputBlob || new Blob([outputBytes!.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(finalBlob);

    return { downloadUrl, fileName, textOutput };
  };

  // Structured FAQ JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.seo.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-8 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
        <Link href="/" className="hover:text-red-600 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="capitalize">{tool.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800">{tool.title}</span>
      </nav>

      {/* Tool Hero */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-600 font-bold text-xs mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SpikeDocs PDF Utility</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {tool.seo.h1}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          {tool.description}
        </p>
      </div>

      {/* Interactive Tool Processor */}
      <ToolProcessor tool={tool} onProcess={handleProcessTool} />

      {/* Step-By-Step How To Section */}
      <div className="mt-16 bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">
          How to use {tool.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tool.seo.steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 font-extrabold text-lg flex items-center justify-center mb-4 shadow-sm border border-red-100">
                {idx + 1}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="mt-12 bg-slate-100/60 rounded-3xl p-8 sm:p-12 border border-slate-200/60">
        <div className="flex items-center gap-3 justify-center mb-8">
          <HelpCircle className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto">
          {tool.seo.faqs.map((faq, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base">{faq.question}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
