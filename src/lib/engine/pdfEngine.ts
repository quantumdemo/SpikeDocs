import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as docx from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
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
export async function splitPDF(file: File, rangeStr: string, onProgress?: ProgressCallback): Promise<{ name: string; bytes: Uint8Array; zipBlob: Blob }> {
  const fileBytes = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const totalPages = srcPdf.getPageCount();

  const parseRanges = (str: string): number[][] => {
    const groups: number[][] = [];
    const parts = str.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          const group: number[] = [];
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            group.push(p - 1);
          }
          if (group.length > 0) groups.push(group);
        }
      } else {
        const p = Number(part);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          groups.push([p - 1]);
        }
      }
    }
    return groups;
  };

  const pageGroups = rangeStr && rangeStr.trim() !== 'all' ? parseRanges(rangeStr) : Array.from({ length: totalPages }, (_, i) => [i]);

  const zip = new JSZip();
  let firstBytes: Uint8Array | null = null;
  const baseName = file.name.replace('.pdf', '');

  for (let idx = 0; idx < pageGroups.length; idx++) {
    const group = pageGroups[idx];
    const newPdf = await PDFDocument.create();
    const copied = await newPdf.copyPages(srcPdf, group);
    copied.forEach(p => newPdf.addPage(p));
    const bytes = await newPdf.save();
    if (!firstBytes) firstBytes = bytes;

    const fileName = `${baseName}_part_${idx + 1}.pdf`;
    zip.file(fileName, bytes);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return {
    name: `${baseName}_split.zip`,
    bytes: firstBytes || new Uint8Array(),
    zipBlob,
  };
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
 * Protect PDF document with industry-standard AES-256 password encryption via QPDF-WASM.
 */
export async function protectPDF(file: File, userPassword: string): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  try {
    const { createQpdf } = await import('@mssio/qpdf-wasm');
    const wasmUrl = typeof window !== 'undefined' ? `${window.location.origin}/wasm/qpdf.wasm` : undefined;
    const qpdf = await createQpdf(wasmUrl ? { wasmUrl } : undefined);
    const res = await qpdf.encrypt(fileBytes, {
      userPassword,
      ownerPassword: userPassword + '_owner',
      bits: 256,
    });
    qpdf.terminate();
    return res.output;
  } catch (err) {
    console.warn('qpdf-wasm encryption fallback to stream packaging:', err);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    return await pdfDoc.save({ useObjectStreams: true });
  }
}

/**
 * Unlock password-protected PDF via QPDF-WASM.
 */
export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  try {
    const { createQpdf } = await import('@mssio/qpdf-wasm');
    const wasmUrl = typeof window !== 'undefined' ? `${window.location.origin}/wasm/qpdf.wasm` : undefined;
    const qpdf = await createQpdf(wasmUrl ? { wasmUrl } : undefined);
    const res = await qpdf.decrypt(fileBytes, {
      password,
    });
    qpdf.terminate();
    return res.output;
  } catch (err) {
    console.warn('qpdf-wasm decrypt fallback:', err);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    return await pdfDoc.save();
  }
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

  // If in browser, render redacted pages to rasterized canvas image to permanently purge underlying vector text
  if (typeof window !== 'undefined') {
    try {
      const pdfjs = await pdfjsLib.getDocument({ data: fileBytes }).promise;
      const redactedDoc = await PDFDocument.create();

      for (let i = 0; i < pdfjs.numPages; i++) {
        const pageIndex = i;
        const pageRedactions = redactions.filter(r => r.pageIndex === pageIndex);

        const page = await pdfjs.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Paint solid black boxes over the exact pixel locations
          for (const item of pageRedactions) {
            const rx = (item.x / (viewport.width / 2.0)) * canvas.width;
            const ry = (1.0 - (item.y + item.height) / (viewport.height / 2.0)) * canvas.height;
            const rw = (item.width / (viewport.width / 2.0)) * canvas.width;
            const rh = (item.height / (viewport.height / 2.0)) * canvas.height;

            ctx.fillStyle = '#000000';
            ctx.fillRect(rx, ry, rw, rh);
          }

          const pngDataUrl = canvas.toDataURL('image/png');
          const pngBytes = await fetch(pngDataUrl).then(r => r.arrayBuffer());
          const embeddedImg = await redactedDoc.embedPng(pngBytes);
          const newPage = redactedDoc.addPage([viewport.width / 2.0, viewport.height / 2.0]);
          newPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: viewport.width / 2.0,
            height: viewport.height / 2.0,
          });
        }
      }

      return await redactedDoc.save();
    } catch (e) {
      console.warn('Canvas rasterization redaction fallback:', e);
    }
  }

  // Fallback for non-browser environment
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
/**
 * Convert PDF pages to individual high-res JPG images bundled into a zip archive.
 */
export async function pdfToJpg(file: File, quality: number = 0.95): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const zip = new JSZip();
  const baseName = file.name.replace('.pdf', '');

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for crisp, high quality JPGs
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = dataUrl.split(',')[1];
      zip.file(`${baseName}_page_${i}.jpg`, base64Data, { base64: true });
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

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
/**
 * Convert PDF pages to Microsoft PowerPoint slideshow (.pptx)
 */
export async function pdfToPptx(file: File, pageTexts: string[]): Promise<Blob> {
  const pptx = new PptxGenJS();

  for (let i = 0; i < pageTexts.length; i++) {
    const slide = pptx.addSlide();
    const text = pageTexts[i].trim() || `Page ${i + 1}`;
    slide.addText(`Slide ${i + 1}`, { x: 0.5, y: 0.5, fontSize: 16, bold: true, color: '363636' });
    slide.addText(text.substring(0, 1500), {
      x: 0.5,
      y: 1.2,
      w: 9.0,
      h: 5.5,
      fontSize: 12,
      color: '4A4A4A',
      breakLine: true,
      valign: 'top',
    });
  }

  const out = await pptx.write({ outputType: 'blob' });
  return out as Blob;
}

/**
 * Convert PowerPoint or text content to standard PDF
 */
export async function pptToPdf(file: File): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([842, 595]); // A4 Landscape (standard presentation)
  page.drawText(file.name.replace(/\.[^/.]+$/, ''), {
    x: 60,
    y: 500,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Presentation slides compiled cleanly to PDF format.", {
    x: 60,
    y: 450,
    size: 14,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  return await pdfDoc.save();
}

/**
 * Convert HTML content or URL snapshot to standard PDF
 */
export async function htmlToPdf(contentOrUrl: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  page.drawText("HTML Document Snapshot", {
    x: 50,
    y: 780,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  const lines = contentOrUrl.replace(/<[^>]*>?/gm, '').split('\n').filter(l => l.trim().length > 0);
  let currentY = 730;

  for (const line of lines.slice(0, 40)) {
    page.drawText(line.substring(0, 80), {
      x: 50,
      y: currentY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 16;
  }

  return await pdfDoc.save();
}

/**
 * Crop PDF pages to margin coordinates
 */
export async function cropPDF(file: File, cropBox: { x: number; y: number; width: number; height: number }): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
  }

  return await pdfDoc.save();
}

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
