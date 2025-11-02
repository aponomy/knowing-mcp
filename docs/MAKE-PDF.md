# make-pdf Tool Documentation

## Overview

The `make-pdf` tool converts Markdown files to PDF format using either pandoc (preferred) or weasyprint. It preserves formatting including headings, code blocks, tables, and other Markdown elements.

## Prerequisites

### Required

**Pandoc** (recommended, provides highest quality output):
- macOS: `brew install pandoc`
- Ubuntu/Debian: `sudo apt-get install pandoc`
- Windows: Download from [pandoc.org](https://pandoc.org/installing.html)

### Optional (for direct PDF output)

Install Python libraries for direct PDF generation:

```bash
pip install markdown weasyprint
```

**Note**: Without these libraries, the tool will create an HTML file that you can:
- Open in a browser and print to PDF
- View directly (fully styled HTML output)

## Usage

### Basic Usage

Convert a Markdown file to PDF:

```javascript
{
  "mdFile": "/path/to/document.md"
}
```

This creates `document.pdf` (or `document.html` if weasyprint is not available) in the same directory.

### Specify Output Path

```javascript
{
  "mdFile": "/path/to/document.md",
  "pdfFile": "/path/to/output.pdf"
}
```

### Advanced Options

```javascript
{
  "mdFile": "/path/to/document.md",
  "pdfFile": "/path/to/output.pdf",
  "method": "auto",                    // "auto", "pandoc", or "weasyprint"
  "toc": true,                         // Include table of contents (pandoc only)
  "paperSize": "a4",                   // Paper size: "a4", "letter", "legal"
  "margin": "2.5cm",                   // Page margin: "1in", "2.5cm", etc.
  "fontFamily": "Helvetica, Arial, sans-serif",  // Font (default: Helvetica)
  "lineHeight": "1.2",                 // Line height (default: 1.2 compact, or 1.5, 1.8, 2.0)
  "fontSize": "11pt"                   // Font size (default: 11pt)
}
```

### Styling Features

- **Page Numbers**: Automatically added to bottom-right of each page (e.g., "Page 1 of 5") - **enabled by default**
- **Custom Fonts**: Choose from system fonts (default: Helvetica, also: Georgia, Times New Roman, Arial)
- **Line Height**: Adjust spacing for readability (default: 1.2 for compact layout, or use 1.5, 1.8, 2.0)
- **Font Size**: Set base text size (default: 11pt)
- **Professional Layout**: Proper heading hierarchy (h1-h6), styled code blocks, tables
- **Heading Sizes**: h1 (2.5em), h2 (2em), h3 (1.5em), h4 (1.25em), h5 (1.1em), h6 (1em)

## Conversion Methods

### Auto (default)
- Tries pandoc + weasyprint first (highest quality with page numbers)
- Falls back to weasyprint only if available
- Creates HTML if neither PDF method works

### Pandoc + WeasyPrint (Recommended)
Best quality output with:
- **Page numbers** (e.g., "Page 1 of 5")
- Custom fonts and line heights
- Table of contents (optional)
- Syntax highlighting
- Professional typography
- Multiple paper sizes

### WeasyPrint Only
Good quality output, requires:
- `markdown` Python library
- `weasyprint` Python library
- System dependencies (cairo, pango)

## Examples

### Example 1: Simple Conversion

Input markdown file (`README.md`):
```markdown
# My Project

This is a sample project.

## Features

- Feature 1
- Feature 2
```

Tool call:
```javascript
{
  "mdFile": "/Users/username/projects/myapp/README.md"
}
```

Result:
- Creates `/Users/username/projects/myapp/README.pdf` (or `.html`)
- Preserves all formatting
- Includes GitHub-style CSS styling

### Example 2: Technical Documentation with Custom Font

Tool call with table of contents and readable font:
```javascript
{
  "mdFile": "/Users/username/docs/API.md",
  "pdfFile": "/Users/username/output/API-v1.pdf",
  "toc": true,
  "paperSize": "letter",
  "margin": "0.75in",
  "fontFamily": "Arial, sans-serif",
  "lineHeight": "1.6",
  "fontSize": "10pt"
}
```

### Example 3: Professional Report

For reports, use A4 paper with comfortable margins and serif font:
```javascript
{
  "mdFile": "/Users/username/reports/Q4-2024.md",
  "pdfFile": "/Users/username/reports/Q4-2024.pdf",
  "paperSize": "a4",
  "margin": "2.5cm",
  "fontFamily": "Georgia, serif",
  "lineHeight": "1.8",
  "fontSize": "11pt"
}
```

### Example 4: Academic Paper

For academic papers with double spacing:
```javascript
{
  "mdFile": "/Users/username/research/paper.md",
  "pdfFile": "/Users/username/research/paper.pdf",
  "paperSize": "letter",
  "margin": "1in",
  "fontFamily": "Times New Roman, serif",
  "lineHeight": "2.0",
  "fontSize": "12pt"
}
```

## Output

### Success Response

```json
{
  "success": true,
  "pdfPath": "/path/to/output.pdf",
  "pdfSize": 125440,
  "method": "pandoc+weasyprint"
}
```

### HTML Output (when weasyprint unavailable)

```json
{
  "success": true,
  "pdfPath": "/path/to/output.html",
  "pdfSize": 5558,
  "method": "pandoc (HTML only)",
  "note": "WeasyPrint not available. HTML file created instead..."
}
```

## Supported Markdown Features

- **Headings** (H1-H6)
- **Text formatting** (bold, italic, strikethrough)
- **Lists** (ordered, unordered)
- **Code blocks** with syntax highlighting
- **Inline code**
- **Tables**
- **Links**
- **Images** (embedded or referenced)
- **Blockquotes**
- **Horizontal rules**

## Troubleshooting

### "Pandoc not available"

Install pandoc:
- macOS: `brew install pandoc`
- Ubuntu: `sudo apt-get install pandoc`
- Windows: Download from pandoc.org

### "WeasyPrint not available"

You can:
1. Use the generated HTML file (open in browser → Print to PDF)
2. Install weasyprint: `pip install weasyprint markdown`
3. Continue with HTML output (still fully functional)

### Large Documents

For very large documents (>100 pages), consider:
- Using pandoc with LaTeX engine (install TeX distribution)
- Breaking into smaller sections
- Using HTML output and browser print

## Tips

1. **Best Quality**: Install pandoc for highest quality PDFs
2. **Quick Preview**: HTML output opens instantly in browsers
3. **Custom Styling**: HTML output uses GitHub-style CSS
4. **Table of Contents**: Use `toc: true` for documents with multiple sections
5. **Print from HTML**: Modern browsers create excellent PDFs from HTML

## Related Tools

- `read-pdf`: Extract content from PDF files
- `read-docx`: Extract content from Word documents
- `md-stat`: Analyze Markdown file structure
- `md-apply`: Edit Markdown files programmatically
