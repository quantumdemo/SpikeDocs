export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'organize' | 'optimize' | 'convert' | 'edit' | 'security' | 'intelligence';
  icon: string;
  isPro?: boolean;
  popular?: boolean;
  accept: string;
  acceptedFileTypesDescription: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    steps: { title: string; desc: string }[];
    faqs: { question: string; answer: string }[];
  };
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'organize', name: 'Organize', icon: 'FolderTree', description: 'Merge, split, extract, and reorder PDF pages' },
  { id: 'optimize', name: 'Optimize', icon: 'Zap', description: 'Compress, repair, and number your document pages' },
  { id: 'convert', name: 'Convert', icon: 'ArrowLeftRight', description: 'Convert to and from PDF, Word, Excel, PPT, and JPG' },
  { id: 'edit', name: 'Edit', icon: 'Edit3', description: 'Add signatures, watermarks, text, shapes, and crop' },
  { id: 'security', name: 'Security', icon: 'ShieldCheck', description: 'Password protect, unlock, and redact sensitive info' },
  { id: 'intelligence', name: 'AI & OCR', icon: 'Sparkles', description: 'AI Summaries, translations, and searchable OCR scans' },
];

export const TOOLS_CONFIG: ToolDefinition[] = [
  // ORGANIZE
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
    category: 'organize',
    icon: 'Merge',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Merge PDF Online - Combine PDF Files Free | SpikeDocs',
      metaDescription: 'Merge PDF files online locally in your browser. 100% private, zero server uploads, super fast and free.',
      h1: 'Merge PDF Files Safely & Instantly',
      steps: [
        { title: 'Select PDF Files', desc: 'Click Select Files or drag and drop your PDFs into SpikeDocs.' },
        { title: 'Reorder Pages', desc: 'Drag thumbnail cards into your desired page order.' },
        { title: 'Download Merged PDF', desc: 'Click Merge PDF to assemble and download your new file locally.' }
      ],
      faqs: [
        { question: 'Is it safe to merge PDFs with SpikeDocs?', answer: 'Yes! SpikeDocs runs 100% locally in your browser. Your files never touch our server.' },
        { question: 'Can I merge password-protected PDFs?', answer: 'You can unlock them first using our Unlock PDF tool before merging.' }
      ]
    }
  },
  {
    id: 'split-pdf',
    slug: 'split-pdf',
    title: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    icon: 'Split',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Split PDF Pages Online - Free PDF Splitter | SpikeDocs',
      metaDescription: 'Extract or split specific pages from your PDF file instantly in your browser.',
      h1: 'Split PDF Document into Separate Files',
      steps: [
        { title: 'Upload PDF', desc: 'Choose the PDF file you want to split.' },
        { title: 'Set Page Ranges', desc: 'Specify exact page numbers or ranges to extract.' },
        { title: 'Save Split PDF', desc: 'Download your extracted pages as standalone PDF documents.' }
      ],
      faqs: [
        { question: 'Can I split multiple pages at once?', answer: 'Yes, you can define multiple page ranges like 1-3, 5, 8-10.' }
      ]
    }
  },
  {
    id: 'extract-pdf',
    slug: 'extract-pdf',
    title: 'Extract Pages',
    description: 'Select and extract specific pages from your document into a fresh PDF file.',
    category: 'organize',
    icon: 'FileOutput',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Extract Pages from PDF - Free Online Tool | SpikeDocs',
      metaDescription: 'Extract any page or range from your PDF file privately on your computer.',
      h1: 'Extract PDF Pages Privately',
      steps: [
        { title: 'Select File', desc: 'Choose your document in the SpikeDocs viewer.' },
        { title: 'Pick Pages', desc: 'Click on the page thumbnails you wish to keep.' },
        { title: 'Extract', desc: 'Download a clean new PDF containing only selected pages.' }
      ],
      faqs: [{ question: 'Does extraction affect original file?', answer: 'No, your original file remains unchanged on your computer.' }]
    }
  },
  {
    id: 'organize-pdf',
    slug: 'organize-pdf',
    title: 'Organize PDF',
    description: 'Sort pages of your PDF file however you like. Delete or add PDF pages easily.',
    category: 'organize',
    icon: 'LayoutGrid',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Organize PDF Pages - Reorder & Delete Pages | SpikeDocs',
      metaDescription: 'Reorder, delete, or rearrange pages in your PDF file with full visual control.',
      h1: 'Organize and Reorder PDF Pages',
      steps: [
        { title: 'Select PDF', desc: 'Open your document in the page editor.' },
        { title: 'Drag & Drop', desc: 'Move thumbnails around or delete unwanted pages.' },
        { title: 'Export', desc: 'Save the updated document layout.' }
      ],
      faqs: [{ question: 'Is page reordering instant?', answer: 'Yes, all visual manipulations occur immediately in browser memory.' }]
    }
  },
  {
    id: 'rotate-pdf',
    slug: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
    category: 'organize',
    icon: 'RotateCw',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Rotate PDF Online - Permanent Rotation | SpikeDocs',
      metaDescription: 'Rotate entire PDF documents or specific pages 90, 180, or 270 degrees.',
      h1: 'Rotate PDF Documents & Pages',
      steps: [
        { title: 'Select Files', desc: 'Upload one or multiple PDF documents.' },
        { title: 'Choose Orientation', desc: 'Rotate clockwise or counter-clockwise.' },
        { title: 'Download', desc: 'Save rotated PDFs instantly.' }
      ],
      faqs: [{ question: 'Can I rotate individual pages?', answer: 'Yes, you can target specific page indexes or rotate all.' }]
    }
  },

  // OPTIMIZE
  {
    id: 'compress-pdf',
    slug: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal PDF quality.',
    category: 'optimize',
    icon: 'Minimize2',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Compress PDF Online - Reduce PDF File Size | SpikeDocs',
      metaDescription: 'Compress PDF documents client-side without losing visual quality.',
      h1: 'Compress PDF Files Locally',
      steps: [
        { title: 'Select File', desc: 'Upload the oversized PDF document.' },
        { title: 'Select Compression Level', desc: 'Choose standard, strong, or extreme compression.' },
        { title: 'Compress & Save', desc: 'Download your optimized lightweight PDF.' }
      ],
      faqs: [{ question: 'How much file size reduction can I expect?', answer: 'Typically between 30% to 80% depending on graphics and font subsetting.' }]
    }
  },
  {
    id: 'repair-pdf',
    slug: 'repair-pdf',
    title: 'Repair PDF',
    description: 'Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool.',
    category: 'optimize',
    icon: 'Wrench',
    accept: '.pdf',
    acceptedFileTypesDescription: 'Corrupted or readable PDF files (.pdf)',
    seo: {
      metaTitle: 'Repair Corrupt PDF Online - Recover PDF Data | SpikeDocs',
      metaDescription: 'Reconstruct broken PDF syntax and recover readable streams locally.',
      h1: 'Repair Damaged or Unreadable PDF Files',
      steps: [
        { title: 'Upload Damaged PDF', desc: 'Select the broken PDF file.' },
        { title: 'Analyze Structure', desc: 'SpikeDocs scans objects and xref tables for recovery.' },
        { title: 'Download Fixed PDF', desc: 'Save the restored file to your device.' }
      ],
      faqs: [{ question: 'Will my corrupted PDF leave my browser?', answer: 'No, all repair engines run in local browser memory.' }]
    }
  },
  {
    id: 'page-numbers',
    slug: 'page-numbers',
    title: 'Page Numbers',
    description: 'Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.',
    category: 'optimize',
    icon: 'Hash',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Add Page Numbers to PDF - Custom Placement | SpikeDocs',
      metaDescription: 'Stamp page numbers onto header or footer sections of your PDF file.',
      h1: 'Add Custom Page Numbers to PDF',
      steps: [
        { title: 'Choose File', desc: 'Upload your document.' },
        { title: 'Configure Numbering', desc: 'Select position (top/bottom, left/center/right) and numbering style.' },
        { title: 'Stamp & Download', desc: 'Apply page numbers and save.' }
      ],
      faqs: [{ question: 'Can I start numbering on page 2?', answer: 'Yes, start page offset is fully supported.' }]
    }
  },

  // CONVERT
  {
    id: 'pdf-to-word',
    slug: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Easily convert your PDF files into easy to edit DOC and DOCX documents with high accuracy.',
    category: 'convert',
    icon: 'FileText',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Convert PDF to Word DOCX Online - SpikeDocs',
      metaDescription: 'Convert PDF documents into editable Word files (.docx) with preserved text and structure.',
      h1: 'Convert PDF to Editable Word Document',
      steps: [
        { title: 'Upload PDF', desc: 'Select your PDF document.' },
        { title: 'Convert', desc: 'Our engine parses streams into structured Word XML.' },
        { title: 'Download DOCX', desc: 'Open and edit in Word or Google Docs.' }
      ],
      faqs: [{ question: 'Is text layout preserved?', answer: 'Yes, text paragraphs and positioning are matched.' }]
    }
  },
  {
    id: 'word-to-pdf',
    slug: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Make DOC and DOCX files easy to read by converting them to PDF.',
    category: 'convert',
    icon: 'FileCheck',
    accept: '.doc,.docx',
    acceptedFileTypesDescription: 'Word documents (.doc, .docx)',
    seo: {
      metaTitle: 'Word to PDF Converter Online - SpikeDocs',
      metaDescription: 'Convert Word DOCX files to clean, universal PDF documents.',
      h1: 'Convert DOCX Word Files to PDF',
      steps: [
        { title: 'Upload DOCX', desc: 'Select your Word document.' },
        { title: 'Render PDF', desc: 'Document layout is converted to PDF format.' },
        { title: 'Download', desc: 'Save your ready-to-print PDF.' }
      ],
      faqs: [{ question: 'Does it work offline?', answer: 'Yes! The PWA parses docx structure directly in your browser.' }]
    }
  },
  {
    id: 'pdf-to-jpg',
    slug: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.',
    category: 'convert',
    icon: 'Image',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Convert PDF to JPG Images Online - SpikeDocs',
      metaDescription: 'Export high quality JPG images from PDF pages.',
      h1: 'Convert PDF Pages to JPG Images',
      steps: [
        { title: 'Select PDF', desc: 'Upload your file.' },
        { title: 'Choose Quality', desc: 'Select image resolution (150 DPI or 300 DPI).' },
        { title: 'Download JPGs', desc: 'Save individual JPGs or a ZIP file.' }
      ],
      faqs: [{ question: 'Are images high resolution?', answer: 'Yes, up to crisp 300 DPI image rendering.' }]
    }
  },
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
    category: 'convert',
    icon: 'FileImage',
    accept: '.jpg,.jpeg,.png,.webp',
    acceptedFileTypesDescription: 'Image files (.jpg, .png, .webp)',
    seo: {
      metaTitle: 'JPG to PDF Converter - Combine Images to PDF | SpikeDocs',
      metaDescription: 'Convert JPG, PNG, or WebP images into a single clean PDF file.',
      h1: 'Convert Images (JPG, PNG) to PDF',
      steps: [
        { title: 'Upload Images', desc: 'Select one or multiple picture files.' },
        { title: 'Arrange Order', desc: 'Reorder images as desired.' },
        { title: 'Generate PDF', desc: 'Download your fresh PDF document.' }
      ],
      faqs: [{ question: 'Can I set page margins?', answer: 'Yes, adjust margins and page orientations before creating the PDF.' }]
    }
  },
  {
    id: 'pdf-to-excel',
    slug: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
    category: 'convert',
    icon: 'Table',
    isPro: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF tables (.pdf)',
    seo: {
      metaTitle: 'PDF to Excel Converter Online - XLSX | SpikeDocs',
      metaDescription: 'Extract tabular data from PDF files directly into Microsoft Excel spreadsheets.',
      h1: 'Convert PDF Tables to Excel (XLSX)',
      steps: [
        { title: 'Upload PDF', desc: 'Select PDF containing tables.' },
        { title: 'Detect Tables', desc: 'Engine parses rows and columns into grid format.' },
        { title: 'Download XLSX', desc: 'Save as an editable Excel workbook.' }
      ],
      faqs: [{ question: 'Is Pro subscription required?', answer: 'Yes, PDF to Excel conversion is an advanced feature.' }]
    }
  },
  {
    id: 'excel-to-pdf',
    slug: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
    category: 'convert',
    icon: 'Sheet',
    accept: '.xlsx,.xls,.csv',
    acceptedFileTypesDescription: 'Excel spreadsheets (.xlsx, .xls, .csv)',
    seo: {
      metaTitle: 'Excel to PDF Converter Online - SpikeDocs',
      metaDescription: 'Convert Excel spreadsheets (XLSX) to formatted PDF documents.',
      h1: 'Convert Excel Worksheets to PDF',
      steps: [
        { title: 'Upload Spreadsheet', desc: 'Select .xlsx or .csv file.' },
        { title: 'Preview Grid', desc: 'Review worksheet presentation.' },
        { title: 'Download PDF', desc: 'Get printable PDF spreadsheets.' }
      ],
      faqs: [{ question: 'Does CSV work?', answer: 'Yes, both CSV and Excel XLSX formats are supported.' }]
    }
  },
  {
    id: 'pdf-to-ppt',
    slug: 'pdf-to-ppt',
    title: 'PDF to PowerPoint',
    description: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
    category: 'convert',
    icon: 'Presentation',
    isPro: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'PDF to PowerPoint PPTX Converter - SpikeDocs',
      metaDescription: 'Convert PDF pages into presentation slides.',
      h1: 'Convert PDF to PowerPoint Presentation',
      steps: [
        { title: 'Upload PDF', desc: 'Choose your presentation PDF.' },
        { title: 'Convert Slides', desc: 'Transform PDF pages into PPTX slide elements.' },
        { title: 'Download PPTX', desc: 'Save presentation for PowerPoint.' }
      ],
      faqs: [{ question: 'Will each page be a slide?', answer: 'Yes, every PDF page becomes a distinct slide.' }]
    }
  },
  {
    id: 'ppt-to-pdf',
    slug: 'ppt-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.',
    category: 'convert',
    icon: 'FileSymlink',
    accept: '.ppt,.pptx',
    acceptedFileTypesDescription: 'PowerPoint files (.ppt, .pptx)',
    seo: {
      metaTitle: 'PowerPoint to PDF Converter - SpikeDocs',
      metaDescription: 'Convert PPTX slideshows to PDF documents.',
      h1: 'Convert PowerPoint PPTX to PDF',
      steps: [
        { title: 'Upload PPTX', desc: 'Select presentation file.' },
        { title: 'Process', desc: 'Render slides to PDF canvas.' },
        { title: 'Download', desc: 'Save completed PDF file.' }
      ],
      faqs: [{ question: 'Are slide transitions preserved?', answer: 'PDFs are static documents designed for printing and viewing.' }]
    }
  },
  {
    id: 'html-to-pdf',
    slug: 'html-to-pdf',
    title: 'HTML to PDF',
    description: 'Convert webpages in HTML or input raw HTML code to generate PDF documents.',
    category: 'convert',
    icon: 'Code',
    isPro: true,
    accept: '.html,.htm',
    acceptedFileTypesDescription: 'HTML files (.html)',
    seo: {
      metaTitle: 'HTML to PDF Converter - SpikeDocs',
      metaDescription: 'Convert HTML code or files to PDF files client-side.',
      h1: 'Convert HTML Web Pages to PDF',
      steps: [
        { title: 'Upload HTML or Paste', desc: 'Provide HTML file or raw code markup.' },
        { title: 'Render', desc: 'Engine compiles HTML and CSS into PDF layout.' },
        { title: 'Download PDF', desc: 'Save formatted output.' }
      ],
      faqs: [{ question: 'Are custom CSS styles respected?', answer: 'Yes, standard inline and document styles are rendered.' }]
    }
  },
  {
    id: 'pdf-to-markdown',
    slug: 'pdf-to-markdown',
    title: 'PDF to Markdown',
    description: 'Turn PDFs into Markdown files for notes, docs, and LLMs with headings and lists intact.',
    category: 'convert',
    icon: 'FileCode',
    isPro: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'PDF to Markdown Converter - SpikeDocs',
      metaDescription: 'Extract formatted Markdown text from PDF documents.',
      h1: 'Convert PDF to Clean Markdown (.md)',
      steps: [
        { title: 'Upload PDF', desc: 'Select document file.' },
        { title: 'Extract Markdown', desc: 'Parse headers, lists, tables into Markdown syntax.' },
        { title: 'Download .md', desc: 'Save clean text file for AI prompts or docs.' }
      ],
      faqs: [{ question: 'Are headings detected automatically?', answer: 'Yes, font weights and sizes determine #, ##, and ### heading levels.' }]
    }
  },
  {
    id: 'pdf-to-pdfa',
    slug: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Transform your PDF to ISO-standardized PDF/A for long-term archiving.',
    category: 'convert',
    icon: 'Archive',
    isPro: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'PDF to PDF/A Converter - Archival Standards | SpikeDocs',
      metaDescription: 'Convert standard PDF documents into compliant PDF/A-1b or PDF/A-2b format.',
      h1: 'Convert PDF to ISO Archival PDF/A Format',
      steps: [
        { title: 'Select PDF', desc: 'Upload PDF file.' },
        { title: 'Embed Fonts & Color Profiles', desc: 'Embed required metadata and fonts.' },
        { title: 'Download PDF/A', desc: 'Save verified archival document.' }
      ],
      faqs: [{ question: 'What is PDF/A used for?', answer: 'PDF/A ensures long-term preservation and compliant legal archiving.' }]
    }
  },

  // EDIT
  {
    id: 'edit-pdf',
    slug: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text, images, shapes or freehand annotations to a PDF document.',
    category: 'edit',
    icon: 'Edit3',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Free PDF Editor Online - Add Text & Annotate | SpikeDocs',
      metaDescription: 'Edit PDF online directly in your browser. Add text, drawings, and shapes.',
      h1: 'Online PDF Editor',
      steps: [
        { title: 'Open File', desc: 'Select PDF document in editor.' },
        { title: 'Annotate', desc: 'Type text, draw shapes, or add signatures.' },
        { title: 'Save & Download', desc: 'Export updated PDF file.' }
      ],
      faqs: [{ question: 'Can I change existing text?', answer: 'You can overlay text and obscure original text using whiteout shapes.' }]
    }
  },
  {
    id: 'watermark',
    slug: 'watermark',
    title: 'Watermark PDF',
    description: 'Stamp an image or text over your PDF in seconds with typography and position options.',
    category: 'edit',
    icon: 'Stamp',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Watermark PDF Online - Add Text or Image Logo | SpikeDocs',
      metaDescription: 'Protect your PDF documents by adding confidential or custom text watermarks.',
      h1: 'Add Watermark to PDF Files',
      steps: [
        { title: 'Upload PDF', desc: 'Select file.' },
        { title: 'Configure Watermark', desc: 'Enter text, set font size, opacity, and angle.' },
        { title: 'Apply & Download', desc: 'Save document with watermark.' }
      ],
      faqs: [{ question: 'Can I control watermark transparency?', answer: 'Yes, slide opacity from 10% to 100%.' }]
    }
  },
  {
    id: 'sign-pdf',
    slug: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Sign yourself or create electronic signatures on your documents.',
    category: 'edit',
    icon: 'PenTool',
    popular: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Sign PDF Online - Draw or Type e-Signature | SpikeDocs',
      metaDescription: 'Draw your signature or upload signature image to sign PDF documents instantly.',
      h1: 'Sign PDF Documents Online',
      steps: [
        { title: 'Upload PDF', desc: 'Select document needing signature.' },
        { title: 'Create Signature', desc: 'Draw signature with mouse/touch or type name.' },
        { title: 'Place & Save', desc: 'Position signature on document and export.' }
      ],
      faqs: [{ question: 'Is my drawn signature stored on a server?', answer: 'Never. Signature data stays in local memory only.' }]
    }
  },
  {
    id: 'crop-pdf',
    slug: 'crop-pdf',
    title: 'Crop PDF',
    description: 'Crop margins of PDF documents or select specific areas to keep.',
    category: 'edit',
    icon: 'Crop',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Crop PDF Margins Online - Free Tool | SpikeDocs',
      metaDescription: 'Crop PDF document boundaries visually.',
      h1: 'Crop PDF Margins & Custom Regions',
      steps: [
        { title: 'Select PDF', desc: 'Upload document.' },
        { title: 'Draw Crop Box', desc: 'Adjust crop handles around content area.' },
        { title: 'Apply Crop', desc: 'Download tightly cropped PDF.' }
      ],
      faqs: [{ question: 'Can I apply crop to all pages?', answer: 'Yes, option to apply crop box to single page or entire document.' }]
    }
  },
  {
    id: 'compare-pdf',
    slug: 'compare-pdf',
    title: 'Compare PDF',
    description: 'Show a side-by-side document comparison and easily spot changes between file versions.',
    category: 'edit',
    icon: 'GitCompare',
    accept: '.pdf',
    acceptedFileTypesDescription: 'Two PDF files (.pdf)',
    seo: {
      metaTitle: 'Compare PDF Files Online - Difference Checker | SpikeDocs',
      metaDescription: 'Compare two PDF documents side-by-side to highlight differences.',
      h1: 'Compare PDF Documents Side-by-Side',
      steps: [
        { title: 'Upload Both Files', desc: 'Select File A and File B.' },
        { title: 'Inspect Differences', desc: 'View synchronized page viewer.' },
        { title: 'Download Comparison', desc: 'Export summary of changes.' }
      ],
      faqs: [{ question: 'Does comparison work page by page?', answer: 'Yes, synchronized scrolling lets you visually spot revisions.' }]
    }
  },
  {
    id: 'pdf-forms',
    slug: 'pdf-forms',
    title: 'PDF Forms',
    description: 'Fill PDF forms yourself or add interactive fillable text fields and checkboxes.',
    category: 'edit',
    icon: 'CheckSquare',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF forms (.pdf)',
    seo: {
      metaTitle: 'Fill PDF Forms Online - Interactive Form Filler | SpikeDocs',
      metaDescription: 'Fill out PDF form fields, text boxes, and checkboxes online.',
      h1: 'Fill Out PDF Forms & Interactive Fields',
      steps: [
        { title: 'Upload Form', desc: 'Select interactive PDF form.' },
        { title: 'Fill Fields', desc: 'Type into form inputs and check boxes.' },
        { title: 'Download Completed Form', desc: 'Export filled PDF.' }
      ],
      faqs: [{ question: 'Can I print filled forms?', answer: 'Yes, form values are baked into the output PDF stream.' }]
    }
  },

  // SECURITY
  {
    id: 'protect-pdf',
    slug: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    category: 'security',
    icon: 'Lock',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Password Protect PDF Online - Encrypt PDF | SpikeDocs',
      metaDescription: 'Encrypt PDF files with AES passwords locally on your computer.',
      h1: 'Password Protect PDF Documents',
      steps: [
        { title: 'Upload Document', desc: 'Select PDF to encrypt.' },
        { title: 'Set Password', desc: 'Type strong password and confirm.' },
        { title: 'Download Encrypted PDF', desc: 'Save protected document.' }
      ],
      faqs: [{ question: 'Can SpikeDocs recover a lost password?', answer: 'No, because we do not store your passwords or files.' }]
    }
  },
  {
    id: 'unlock-pdf',
    slug: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
    category: 'security',
    icon: 'Unlock',
    accept: '.pdf',
    acceptedFileTypesDescription: 'Protected PDF files (.pdf)',
    seo: {
      metaTitle: 'Unlock PDF - Remove PDF Password Protection | SpikeDocs',
      metaDescription: 'Remove password protection and restrictions from PDF files locally.',
      h1: 'Unlock PDF Passwords & Restrictions',
      steps: [
        { title: 'Select Protected PDF', desc: 'Upload password locked PDF.' },
        { title: 'Enter Password', desc: 'Type authorized password to decrypt stream.' },
        { title: 'Download Unlocked PDF', desc: 'Save unlocked PDF file.' }
      ],
      faqs: [{ question: 'Do I need owner permission?', answer: 'You must have legal right or know the password to decrypt the file.' }]
    }
  },
  {
    id: 'redact-pdf',
    slug: 'redact-pdf',
    title: 'Redact PDF',
    description: 'Redact text and graphics to permanently remove sensitive information from a PDF.',
    category: 'security',
    icon: 'EyeOff',
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'Redact PDF Online - Permanently Remove Sensitive Data | SpikeDocs',
      metaDescription: 'Black out sensitive personal or financial information permanently from PDF documents.',
      h1: 'Permanently Redact PDF Documents',
      steps: [
        { title: 'Upload PDF', desc: 'Select file containing sensitive text.' },
        { title: 'Select Areas', desc: 'Draw black redaction rectangles over private data.' },
        { title: 'Burn Redactions', desc: 'Permanently purge covered vectors and text.' }
      ],
      faqs: [{ question: 'Can redacted text be copied or recovered?', answer: 'No! Redaction permanently strips the underlying text content.' }]
    }
  },

  // INTELLIGENCE
  {
    id: 'ai-summarizer',
    slug: 'ai-summarizer',
    title: 'AI Summarizer',
    description: 'Quickly generate concise summaries, bullet points, and key insights from PDF documents.',
    category: 'intelligence',
    icon: 'Sparkles',
    isPro: true,
    accept: '.pdf,.txt,.md',
    acceptedFileTypesDescription: 'PDF or text documents (.pdf, .txt, .md)',
    seo: {
      metaTitle: 'AI PDF Summarizer - Instant Document Summaries | SpikeDocs',
      metaDescription: 'Summarize lengthy PDF reports, academic papers, and essays using browser AI.',
      h1: 'AI PDF Document Summarizer',
      steps: [
        { title: 'Upload Document', desc: 'Select PDF or text file.' },
        { title: 'Choose Summary Style', desc: 'Select key takeaways, executive summary, or bullet list.' },
        { title: 'Generate Summary', desc: 'Receive instant structured text summary.' }
      ],
      faqs: [{ question: 'Is document content sent to external servers?', answer: 'Text is parsed locally and sent through secure encrypted prompt streams directly from your client.' }]
    }
  },
  {
    id: 'translate-pdf',
    slug: 'translate-pdf',
    title: 'Translate PDF',
    description: 'Translate PDF files powered by AI while preserving document formatting.',
    category: 'intelligence',
    icon: 'Languages',
    isPro: true,
    accept: '.pdf',
    acceptedFileTypesDescription: 'PDF files (.pdf)',
    seo: {
      metaTitle: 'AI PDF Translator - Keep Layout Intact | SpikeDocs',
      metaDescription: 'Translate PDF files into 50+ languages without breaking typography or layout.',
      h1: 'AI PDF Document Translator',
      steps: [
        { title: 'Upload PDF', desc: 'Select document to translate.' },
        { title: 'Select Target Language', desc: 'Choose target language (e.g., Spanish, French, German, Chinese).' },
        { title: 'Translate & Export', desc: 'Download translated PDF with original layout.' }
      ],
      faqs: [{ question: 'Are layout elements preserved?', answer: 'Yes, paragraph positions and font styling are maintained.' }]
    }
  },
  {
    id: 'ocr-pdf',
    slug: 'ocr-pdf',
    title: 'OCR PDF / Scan to PDF',
    description: 'Convert scanned image PDFs into searchable, selectable PDF documents via WebAssembly OCR.',
    category: 'intelligence',
    icon: 'ScanText',
    isPro: true,
    accept: '.pdf,.jpg,.png',
    acceptedFileTypesDescription: 'Scanned PDF or images (.pdf, .jpg, .png)',
    seo: {
      metaTitle: 'OCR PDF Online - Convert Scanned PDF to Searchable Text | SpikeDocs',
      metaDescription: 'Extract text from scanned PDF images using in-browser Tesseract WebAssembly OCR.',
      h1: 'OCR Searchable PDF Converter',
      steps: [
        { title: 'Upload Scanned PDF', desc: 'Select scanned image document.' },
        { title: 'Select OCR Language', desc: 'Pick document language for text recognition.' },
        { title: 'Run OCR & Download', desc: 'Receive searchable PDF with hidden text layer.' }
      ],
      faqs: [{ question: 'Does OCR run in browser?', answer: 'Yes! SpikeDocs uses Tesseract.js WebAssembly engine directly in browser memory.' }]
    }
  }
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_CONFIG.find((t) => t.slug === slug);
}
