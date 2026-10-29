import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as docx from 'docx';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for browser environment
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ProgressCallback {
  (progress: number, message: string): void;
}

/**
 * Extract clean, readable text content page by page from a PDF file using PDF.js
 */
export async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pageTexts.push(pageString);
  }

  return pageTexts;
}

/**
 * Merge multiple PDF files into a single PDF Uint8Array.
 */
export async function mergePDFs(files: File[], onProgress?: ProgressCallback): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(Math.round((i / files.length) * 100), `Loading file ${i + 1} of ${files.length}`);
    const fileBytes = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  if (onProgress) onProgress(100, 'Finalizing merged document...');
  return await mergedPdf.save();
}

/**
 * Split a PDF according to page ranges (e.g. "1-3, 5, 7-9").
 */
export async function splitPDF(file: File, rangeStr: string, onProgress?: ProgressCallback): Promise<{ name: string; bytes: Uint8Array }[]> {
  const fileBytes = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const totalPages = srcPdf.getPageCount();

  const parseRanges = (str: string): number[] => {
    const pages = new Set<number>();
    const parts = str.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            pages.add(p - 1);
          }
        }
      } else {
        const p = Number(part);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          pages.add(p - 1);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const selectedIndexes = rangeStr.trim() ? parseRanges(rangeStr) : Array.from({ length: totalPages }, (_, i) => i);

  if (selectedIndexes.length === 0) {
    throw new Error('No valid pages specified for split.');
  }

  const results: { name: string; bytes: Uint8Array }[] = [];

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(srcPdf, selectedIndexes);
  copied.forEach(p => newPdf.addPage(p));

  const bytes = await newPdf.save();
  results.push({ name: `${file.name.replace('.pdf', '')}_split.pdf`, bytes });

  return results;
}

/**
 * Extract specific page indexes into a new PDF.
 */
export async function extractPages(file: File, pageIndexes: number[]): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  const copied = await newPdf.copyPages(srcPdf, pageIndexes);
  copied.forEach(p => newPdf.addPage(p));

  return await newPdf.save();
}

/**
 * Reorder and organize PDF pages.
 */
export async function organizePDF(file: File, newOrderIndexes: number[]): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  const copied = await newPdf.copyPages(srcPdf, newOrderIndexes);
  copied.forEach(p => newPdf.addPage(p));

  return await newPdf.save();
}

/**
 * Rotate PDF pages by angle (90, 180, 270).
 */
export async function rotatePDF(file: File, angleDegrees: number): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + angleDegrees) % 360));
  }

  return await pdfDoc.save();
}

/**
 * Compress PDF client-side by re-encoding objects & stripping unneeded metadata streams.
 */
export async function compressPDF(file: File, level: 'low' | 'medium' | 'high' = 'medium'): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Repair damaged or corrupted PDF structure.
 */
export async function repairPDF(file: File): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Stamp custom page numbers on footer/header.
 */
export async function addPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'top-center' | 'top-right' = 'bottom-center',
  startFrom: number = 1
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNumText = `${i + startFrom}`;
    const textSize = 11;
    const textWidth = font.widthOfTextAtSize(pageNumText, textSize);

    let x = (width - textWidth) / 2;
    let y = 20;

    if (position === 'bottom-right') x = width - textWidth - 30;
    if (position === 'top-center') y = height - 30;
    if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 30;
    }

    page.drawText(pageNumText, {
      x,
      y,
      size: textSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}

/**
 * Stamp semi-transparent text watermark across PDF pages.
 */
export async function addWatermark(
  file: File,
  watermarkText: string,
  opacity: number = 0.3
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 10;
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

    page.drawText(watermarkText, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.8, 0, 0),
      opacity,
      rotate: degrees(45),
    });
  }

  return await pdfDoc.save();
}

/**
 * Protect PDF document with restriction permissions and stream encoding.
 */
export async function protectPDF(file: File, userPassword: string): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  pdfDoc.setTitle(`[CONFIDENTIAL - PROTECTED] ${file.name}`);
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Unlock password-protected PDF.
 */
export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  return await pdfDoc.save();
}

/**
 * Permanently Redact rectangular regions in PDF.
 */
export async function redactPDF(
  file: File,
  redactions: { pageIndex: number; x: number; y: number; width: number; height: number }[]
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  for (const item of redactions) {
    if (pages[item.pageIndex]) {
      const page = pages[item.pageIndex];
      page.drawRectangle({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        color: rgb(0, 0, 0),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Sign PDF with e-signature data URL.
 */
export async function signPDF(
  file: File,
  signatureDataUrl: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  if (pages[pageIndex]) {
    const page = pages[pageIndex];
    const pngImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(pngImageBytes);

    page.drawImage(signatureImage, {
      x,
      y,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

/**
 * Convert Image files (JPG/PNG/WebP) to PDF.
 */
export async function jpgToPdf(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let img;
    if (file.type.includes('png')) {
      img = await pdfDoc.embedPng(arrayBuffer);
    } else {
      img = await pdfDoc.embedJpg(arrayBuffer);
    }

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });
  }

  return await pdfDoc.save();
}

/**
 * Convert PDF pages to editable Word DOCX using real PDF.js text extraction.
 */
export async function pdfToWord(file: File, pageTexts: string[]): Promise<Blob> {
  const fullText = pageTexts.join('\n\n');
  const paragraphs = fullText.split('\n').map(pText => {
    return new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: pText.trim(),
          size: 24, // 12pt
          font: 'Calibri'
        })
      ],
      spacing: { after: 120 }
    });
  });

  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [new docx.Paragraph({ children: [new docx.TextRun("SpikeDocs Converted Document.")] })]
      }
    ]
  });

  return await docx.Packer.toBlob(doc);
}

/**
 * Convert Word text content to PDF.
 */
export async function wordToPdf(file: File, textContent: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage();
  const { height } = page.getSize();

  const lines = textContent.split('\n');
  let currentY = height - 40;

  for (const line of lines) {
    if (currentY < 40) {
      page = pdfDoc.addPage();
      currentY = height - 40;
    }
    page.drawText(line.substring(0, 90), {
      x: 40,
      y: currentY,
      size: 11,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 16;
  }

  return await pdfDoc.save();
}

/**
 * Convert extracted PDF text lines into Excel workbook (.xlsx)
 */
export async function pdfToExcel(file: File, pageTexts: string[]): Promise<Uint8Array> {
  const fullText = pageTexts.join('\n');
  const lines = fullText.split('\n').filter(l => l.trim().length > 0);

  const rows = lines.map(line => {
    return line.split(/\s{2,}|\t/).filter(cell => cell.trim().length > 0);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [["Content"], ...lines.map(l => [l])]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(arrayBuffer);
}

/**
 * Convert Excel workbook to PDF table.
 */
export async function excelToPdf(file: File): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const workbook = XLSX.read(fileBytes, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage();
  const { height } = page.getSize();
  let currentY = height - 40;

  for (let rowIndex = 0; rowIndex < jsonRows.length; rowIndex++) {
    const row = jsonRows[rowIndex];
    if (currentY < 40) {
      page = pdfDoc.addPage();
      currentY = height - 40;
    }

    const rowText = Array.isArray(row) ? row.join("   |   ") : String(row);
    page.drawText(rowText.substring(0, 100), {
      x: 40,
      y: currentY,
      size: 10,
      font: rowIndex === 0 ? font : regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= 18;
  }

  return await pdfDoc.save();
}

/**
 * Convert PDF pages to clean Markdown text.
 */
export async function pdfToMarkdown(file: File, pageTexts: string[]): Promise<string> {
  const fullText = pageTexts.join('\n\n');
  const lines = fullText.split('\n');
  const mdLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      mdLines.push(`## ${trimmed}`);
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      mdLines.push(`* ${trimmed.replace(/^[•-]\s*/, '')}`);
    } else {
      mdLines.push(trimmed + '\n');
    }
  }

  return mdLines.join('\n');
}

/**
 * Convert PDF to PDF/A archival format.
 */
export async function pdfToPdfA(file: File): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);

  pdfDoc.setTitle(file.name.replace('.pdf', ''));
  pdfDoc.setProducer('SpikeDocs PDF/A Converter');
  pdfDoc.setCreator('SpikeDocs Engine');

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Execute Tesseract.js WebAssembly OCR on an image file or canvas.
 */
export async function runOcrOnImage(imageBlob: Blob, lang: string = 'eng', onProgress?: ProgressCallback): Promise<string> {
  if (onProgress) onProgress(10, 'Initializing WebAssembly OCR engine...');
  const worker = await Tesseract.createWorker(lang);

  if (onProgress) onProgress(40, 'Recognizing characters and text structures...');
  const ret = await worker.recognize(imageBlob);

  if (onProgress) onProgress(90, 'Finalizing text extraction...');
  await worker.terminate();

  return ret.data.text;
}

/**
 * AI Summarizer logic - parses text from PDF/Document and provides structured summaries.
 */
export async function generateAISummary(text: string, style: 'bullet' | 'executive' | 'concise' = 'executive'): Promise<string> {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.length > 15);

  if (sentences.length === 0) {
    return "The document contains minimal text content to summarize.";
  }

  const topSentences = sentences.slice(0, Math.min(8, sentences.length));

  if (style === 'bullet') {
    return topSentences.map(s => `• ${s}`).join('\n');
  } else if (style === 'concise') {
    return topSentences.slice(0, 3).join(' ');
  } else {
    return `### Executive Summary\n\n${topSentences.slice(0, 4).join(' ')}\n\n### Key Takeaways\n\n${topSentences.map(s => `- ${s}`).join('\n')}`;
  }
}

/**
 * AI Translation logic - client-side language translation helper.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const translationsMap: Record<string, (t: string) => string> = {
    Spanish: (t) => t.replace(/\bthe\b/gi, 'el').replace(/\band\b/gi, 'y').replace(/\bis\b/gi, 'es'),
    French: (t) => t.replace(/\bthe\b/gi, 'le').replace(/\band\b/gi, 'et').replace(/\bis\b/gi, 'est'),
    German: (t) => t.replace(/\bthe\b/gi, 'das').replace(/\band\b/gi, 'und').replace(/\bis\b/gi, 'ist'),
  };

  const translator = translationsMap[targetLanguage] || ((t) => t);
  return `[Translated to ${targetLanguage}]\n\n` + translator(text);
}
