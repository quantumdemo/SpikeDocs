import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Shield, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PDF Guides & Resources - SpikeDocs',
  description: 'Learn how to process, merge, compress, edit, and convert PDFs safely with browser-based client-side processing.',
};

const articles = [
  {
    title: 'Why Client-Side PDF Processing is essential for Enterprise Security',
    slug: 'client-side-pdf-security',
    excerpt: 'Discover why uploading sensitive legal contracts to standard web converters poses massive compliance risks, and how browser WebAssembly protects your data.',
    date: 'March 2025',
    toolLink: '/merge-pdf',
    toolName: 'Merge PDF'
  },
  {
    title: 'How to OCR Scanned PDFs directly in your Browser without Cloud Servers',
    slug: 'browser-ocr-tesseract-guide',
    excerpt: 'A comprehensive guide on WebAssembly Tesseract OCR for turning scanned images and unselectable PDFs into searchable text.',
    date: 'February 2025',
    toolLink: '/ocr-pdf',
    toolName: 'OCR PDF'
  },
  {
    title: 'How to Convert PDF to Editable Word DOCX without Losing Paragraph Layout',
    slug: 'pdf-to-word-conversion-tips',
    excerpt: 'Learn the underlying structure of PDF streams vs Word XML formatting and how to extract clean text for editing.',
    date: 'January 2025',
    toolLink: '/pdf-to-word',
    toolName: 'PDF to Word'
  }
];

export default function ResourcesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Knowledge & Guides</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">SpikeDocs Resource Center</h1>
        <p className="text-slate-600 text-base">In-depth articles, security guides, and tutorials on document engineering and privacy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art) => (
          <div key={art.slug} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{art.date}</span>
              <h2 className="font-extrabold text-slate-900 text-lg leading-snug">{art.title}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">{art.excerpt}</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href={art.toolLink} className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:underline">
                <span>Try {art.toolName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
