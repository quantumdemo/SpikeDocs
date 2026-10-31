# SpikeDocs: Conversion Layout & Typography Architecture Report (`tool-yet-resolved.md`)

## 1. Overview & Current Status

In document conversion tools (such as **PDF to Word**, **PDF to Excel**, **PDF to PowerPoint**, **Word to PDF**, and **Excel to PDF**), users can choose between two fundamental formatting strategies:

1. **Preserve Precise Layout (Absolute Coordinate Positioning)**:
   - Locks text fragments, tables, and graphic elements to exact $(X, Y)$ coordinate bounding boxes.
   - Ideal for design-heavy brochures, legal forms, flyers, and certificates where pixel alignment must never shift.
2. **Standard Flow Formatting (Natural Flow / Semantic Reflow)**:
   - Groups text into fluid semantic blocks (headings, paragraphs, bullet lists, flowing table cells).
   - Ideal for documents that need continuous editing in Microsoft Word, Google Docs, or PowerPoint without fixed text frame collisions.

---

## 2. Tools Status & Behavioral Differences

| Tool | "Preserve Precise Layout" Behavior | "Standard Flow Formatting" Behavior | Resolution Status |
| :--- | :--- | :--- | :--- |
| **PDF to Word (`pdf-to-word`)** | Extracts text with bounding coordinates and maps them into fixed table/frame structures in `.docx`. | Groups lines into natural word-wrapping paragraphs with semantic linebreaks. | **Active & Handled** |
| **PDF to PowerPoint (`pdf-to-ppt`)** | Stamps slide objects onto exact coordinate regions ($X, Y, W, H$). | Wraps text content into centered presentation slide text blocks. | **Active & Handled** |
| **Word to PDF (`word-to-pdf`)** | Parses `word/document.xml` formatting tags, sanitizing control characters to prevent encoding crashes. | Renders plain text sequentially with standardized page margins ($50\text{pt}$). | **Active & Handled** |
| **PDF to Excel (`pdf-to-excel`)** | Splits column structures based on multi-space coordinate tab stops ($X$ spacing). | Emits sequential line rows. | **Active & Handled** |
| **Excel to PDF (`excel-to-pdf`)** | Computes cell bounding boxes to draw clean gridlines and column alignments. | Formats row values with simple separator pipes. | **Active & Handled** |

---

## 3. High-Complexity Tools Pending Advanced Layout Reflow

The following two specialized scenarios represent active research areas for future releases:

1. **Multi-Column Magazine Reflow (`pdf-to-word`)**:
   - *Challenge*: PDFs with multiple newspaper-style columns (e.g. 3 columns per page) currently require reading order reconstruction using Voronoi or bounding box sorting so text flows from column 1 to column 2 rather than reading horizontally across all 3 columns.
   - *Current Implementation*: Reads top-down page-by-page coordinates.
2. **Vector Graphics & Bezier Path Conversion (`word-to-pdf` / `ppt-to-pdf`)**:
   - *Challenge*: Client-side converting Microsoft Office DrawingML vector shapes directly into PDF vector streams without server-side LibreOffice or Microsoft Word binaries.
   - *Current Implementation*: Converts text, layout blocks, and embedded bitmaps client-side.

All 31 tools operate client-side in browser memory with zero server retention, complying with the SpikeDocs privacy guarantee.
