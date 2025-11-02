# Document Processing Tools

## Overview

The document processing tools enable you to read, extract, and create documents in various formats. You can:
- **Read** PDF and Microsoft Word files, converting them to plain text or structured markdown
- **Create** PDF files from Markdown documents

This is useful for document analysis, content extraction, report generation, and integration with AI workflows.

## Prerequisites

The document tools require Python 3 and specific libraries:

```bash
# Install PDF reading support
pip install pypdf

# Install Word document support  
pip install python-docx

# Install PDF creation support (optional - see below)
pip install markdown weasyprint
```

**Note**: The `make-pdf` tool can work with just pandoc installed (creates HTML that can be printed to PDF), so weasyprint is optional.

## Tools

### `make-pdf` - Markdown to PDF Converter

Convert Markdown files to PDF format using pandoc (preferred) or weasyprint. See [MAKE-PDF.md](MAKE-PDF.md) for complete documentation.

#### Prerequisites

**Required**: Pandoc (for best quality)
- macOS: `brew install pandoc`
- Ubuntu/Debian: `sudo apt-get install pandoc`
- Windows: [pandoc.org](https://pandoc.org/installing.html)

**Optional**: For direct PDF output (without these, creates HTML)
```bash
pip install markdown weasyprint
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mdFile` | string | ✅ Yes | Absolute path to the Markdown file |
| `pdfFile` | string | No | Output PDF path (defaults to same name as input) |
| `method` | string | No | Conversion method: `"auto"`, `"pandoc"`, or `"weasyprint"` |
| `toc` | boolean | No | Include table of contents (pandoc only) |
| `paperSize` | string | No | Paper size: `"a4"`, `"letter"`, `"legal"` |
| `margin` | string | No | Page margin: e.g., `"1in"`, `"2.5cm"` |

#### Examples

##### Basic Conversion
```javascript
{
  "mdFile": "/Users/username/documents/README.md"
}
```

##### With Table of Contents
```javascript
{
  "mdFile": "/Users/username/docs/API.md",
  "pdfFile": "/Users/username/output/API-v1.pdf",
  "toc": true,
  "paperSize": "letter",
  "margin": "0.75in"
}
```

#### Response

```json
{
  "success": true,
  "pdfPath": "/path/to/output.pdf",
  "pdfSize": 125440,
  "method": "pandoc+weasyprint"
}
```

### `read-pdf` - PDF Reader

Read a PDF file and extract its content as text or markdown.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | ✅ Yes | Absolute path to the PDF file |
| `format` | string | No | Output format: `"text"` or `"markdown"` (default: `"markdown"`) |

### Response

The tool returns:
- **File information**: Path, page count
- **Metadata**: Title, author, subject, creation date, etc. (if available in PDF)
- **Content**: Full text content with page markers
- **Format-specific output**:
  - **Text format**: Plain text with page separators
  - **Markdown format**: Structured markdown with headings, metadata section, and per-page content

### Examples

#### Example 1: Read PDF as Markdown (Default)

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/documents/report.pdf"
  }
}
```

**Response:**
```markdown
📄 **PDF Read Successfully**

**File:** /Users/username/documents/report.pdf
**Pages:** 12
**Title:** Annual Report 2024
**Author:** John Doe

---

# Annual Report 2024

## Document Information

**Author:** John Doe  
**Subject:** Financial Summary  
**Pages:** 12  
**Created:** D:20240115103000Z  

---

## Content

### Page 1

[Content from page 1...]

### Page 2

[Content from page 2...]
```

#### Example 2: Read PDF as Plain Text

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/documents/invoice.pdf",
    "format": "text"
  }
}
```

**Response:**
```
📄 **PDF Read Successfully**

**File:** /Users/username/documents/invoice.pdf
**Pages:** 3

---

--- Page 1 ---
INVOICE
Invoice #: INV-2024-001
Date: January 15, 2024
...

--- Page 2 ---
[Content from page 2...]

--- Page 3 ---
[Content from page 3...]
```

---

### `read-docx` - Word Document Reader

Read a Microsoft Word (.docx) file and extract its content as text or markdown.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | ✅ Yes | Absolute path to the DOCX file |
| `format` | string | No | Output format: `"text"` or `"markdown"` (default: `"markdown"`) |

#### Response

The tool returns:
- **File information**: Path, paragraph count, table count
- **Metadata**: Title, author, subject, keywords, dates, revision number
- **Content**: Full text content from paragraphs and tables
- **Format-specific output**:
  - **Text format**: Plain text with table data in pipe-separated format
  - **Markdown format**: Structured markdown with Word styles converted to headings and properly formatted tables

#### Examples

##### Example 1: Read DOCX as Markdown (Default)

```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/Users/username/documents/report.docx"
  }
}
```

**Response:**
```markdown
📝 **Word Document Read Successfully**

**File:** /Users/username/documents/report.docx
**Paragraphs:** 45
**Tables:** 2
**Title:** Project Report
**Author:** Jane Smith

---

# Project Report

## Document Information

**Author:** Jane Smith  
**Subject:** Q4 Analysis  
**Keywords:** project, analysis, 2024  
**Paragraphs:** 45  
**Tables:** 2  
**Created:** 2024-10-15 10:30:00  

---

## Content

## Executive Summary

This report provides an overview...

### Key Findings

- Finding 1
- Finding 2

---

## Tables

### Table 1

| Metric | Q3 | Q4 | Change |
|---|---|---|---|
| Revenue | $100K | $150K | +50% |
| Users | 1000 | 1500 | +50% |
```

##### Example 2: Read DOCX as Plain Text

```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/Users/username/documents/notes.docx",
    "format": "text"
  }
}
```

**Response:**
```
📝 **Word Document Read Successfully**

**File:** /Users/username/documents/notes.docx
**Paragraphs:** 12

---

Meeting Notes

Date: October 31, 2024

Attendees

John Doe
Jane Smith
...

--- Tables ---

[Table 1]
Action Item | Owner | Due Date
Follow up with client | John | Nov 5
Update documentation | Jane | Nov 10
```

---

## Use Cases

### 1. Document Analysis

Extract content from PDFs for analysis, summarization, or processing:

```javascript
// Read a research paper
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/papers/research-paper.pdf",
    "format": "markdown"
  }
}

// Then use the content with ask-expert
{
  "name": "ask-expert",
  "arguments": {
    "question": "Summarize the key findings from this research paper",
    "context": "[paste the PDF content here]"
  }
}
```

### 2. Invoice Processing

Extract data from invoices or receipts:

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/invoices/invoice-2024-01.pdf",
    "format": "text"
  }
}
```

### 3. Legal Document Review

Read contracts or legal documents:

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/contracts/agreement.pdf",
    "format": "markdown"
  }
}
```

### 4. Batch Processing

Combine with other tools for batch PDF processing:

```javascript
// Read multiple PDFs and save summaries to CSV
// 1. Read first PDF
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/docs/doc1.pdf"
  }
}

// 2. Save summary to CSV
{
  "name": "append-csv-row",
  "arguments": {
    "filePath": "/Users/username/output/summaries.csv",
    "row": ["doc1.pdf", "Title from PDF", "Summary text..."]
  }
}
```

## Features

### Markdown Output Features

When using `format: "markdown"`, the output includes:

1. **Structured Headings**
   - H1 for document title (from metadata)
   - H2 for sections (Document Information, Content)
   - H3 for each page

2. **Metadata Section**
   - Author, Subject, Page count
   - Creation and modification dates
   - Clean formatting with bold labels

3. **Page-by-Page Content**
   - Each page clearly labeled
   - Easy to navigate and reference
   - Preserves original text layout

### Text Output Features

When using `format: "text"`, the output includes:

1. **Page Markers**
   - Clear page separators: `--- Page N ---`
   - Maintains page boundaries
   - Simple plain text format

2. **Raw Content**
   - Unformatted text extraction
   - Suitable for further processing
   - Lower overhead

## Technical Details

### PDF Extraction

- Uses Python's `pypdf` library for robust PDF reading
- Extracts text from all pages
- Preserves metadata when available in PDF
- Handles various PDF formats and encodings

### Performance

- **Buffer Size**: 10MB max for large PDFs
- **Processing**: Synchronous execution
- **Memory**: Scales with PDF size
- **Speed**: Fast for most documents (<1s for typical PDFs)

### Limitations

1. **Image-based PDFs**: Cannot extract text from scanned PDFs without OCR
2. **Complex Layouts**: May not preserve exact formatting for complex layouts
3. **Tables**: Table structure may not be perfectly preserved
4. **Images**: Only text is extracted, images are ignored
5. **Encrypted PDFs**: May not work with password-protected PDFs

### Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `pypdf library not installed` | Missing Python dependency | Run `pip install pypdf` |
| `PDF file not found` | Invalid file path | Check the absolute path is correct |
| `File is not a PDF` | Wrong file type | Ensure file has `.pdf` extension |
| `Failed to execute PDF reader` | Python not found | Ensure Python 3 is installed and in PATH |

## Comparison with Other Tools

| Feature | `read-pdf` | Browser screenshot | CSV tools |
|---------|-----------|-------------------|-----------|
| Input format | PDF files | Web pages | CSV data |
| Output | Text/Markdown | Image | Structured data |
| Use case | Document extraction | Visual capture | Data collection |
| Dependencies | Python + pypdf | Playwright | None |

## Best Practices

1. **Use Absolute Paths**
   ```javascript
   // ✅ Good
   "filePath": "/Users/username/documents/file.pdf"
   
   // ❌ Bad
   "filePath": "~/documents/file.pdf"  // Tilde may not expand
   "filePath": "../documents/file.pdf"  // Relative paths may fail
   ```

2. **Choose the Right Format**
   - Use **markdown** for: AI analysis, human reading, structured documents
   - Use **text** for: Simple extraction, further processing, raw content

3. **Handle Large PDFs**
   - Be aware of the 10MB buffer limit
   - For very large PDFs, consider processing in chunks
   - Monitor memory usage for batch operations

4. **Validate File Existence**
   - Check that files exist before calling the tool
   - Use proper error handling for missing files

## Integration Examples

### With Ask-Expert

```javascript
// 1. Read PDF
const pdfResult = await readPdf({
  filePath: "/path/to/document.pdf",
  format: "markdown"
});

// 2. Analyze with expert
{
  "name": "ask-expert",
  "arguments": {
    "question": "What are the key points in this document?",
    "context": `PDF Content:\n${pdfResult.content}`,
    "reasoning_effort": "medium"
  }
}
```

### With Browser Automation

```javascript
// 1. Download PDF from website (using browser)
// 2. Read the downloaded PDF
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/Downloads/downloaded-report.pdf"
  }
}

// 3. Extract data and save to CSV
{
  "name": "append-csv-row",
  "arguments": {
    "filePath": "/Users/username/data/reports.csv",
    "row": ["report-name", "extracted-data", "summary"]
  }
}
```

## Installation & Setup

1. **Install Python dependencies**:
   ```bash
   pip install pypdf
   ```

2. **Verify installation**:
   ```bash
   python3 -c "import pypdf; print('pypdf installed successfully')"
   ```

3. **Test the tool**:
   ```javascript
   {
     "name": "read-pdf",
     "arguments": {
       "filePath": "/path/to/test.pdf"
     }
   }
   ```

## Troubleshooting

### Python not found

If you see "Failed to execute PDF reader":

```bash
# Check Python installation
which python3

# If not found, install Python 3
# macOS: brew install python3
# Linux: apt-get install python3
```

### pypdf not installed

```bash
# Install pypdf
pip install pypdf

# Or use pip3
pip3 install pypdf
```

### Permission denied

```bash
# Make the script executable
chmod +x scripts/read-pdf.py
```

### Large PDF timeout

For very large PDFs, the tool may time out. Consider:
- Breaking the PDF into smaller files
- Increasing the buffer size in the code
- Using text format instead of markdown (faster)

## Related Tools

- **`append-csv-row`**: Save extracted data to CSV files
- **`ask-expert`**: Analyze PDF content with AI
- **Browser tools**: Download PDFs from websites before reading
