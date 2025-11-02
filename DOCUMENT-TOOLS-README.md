# 📚 Document Processing Tools - Quick Reference

## ✅ Installed and Ready

Your knowing-mcp server now has **TWO** powerful document processing tools!

### 1. `read-pdf` - PDF Reader
```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/absolute/path/to/document.pdf",
    "format": "markdown"  // or "text"
  }
}
```

**Features:**
- ✅ Extract text from PDF pages
- ✅ PDF metadata (title, author, dates)
- ✅ Page-by-page breakdown
- ✅ Markdown or plain text output

### 2. `read-docx` - Word Document Reader ⭐
```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/absolute/path/to/document.docx",
    "format": "markdown"  // or "text"
  }
}
```

**Features:**
- ✅ Extract paragraphs and tables
- ✅ Convert Word styles to markdown headings
- ✅ Document metadata (title, author, keywords, revision)
- ✅ Markdown-formatted tables
- ✅ Markdown or plain text output

## 📦 Dependencies (Already Installed)

```bash
✅ pypdf 6.1.3
✅ python-docx 1.2.0
```

To reinstall if needed:
```bash
pip install pypdf python-docx
```

## 🎯 Common Use Cases

### Analyze Documents with AI
```javascript
// 1. Read document
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/path/to/report.docx"
  }
}

// 2. Analyze
{
  "name": "ask-expert",
  "arguments": {
    "question": "Summarize key points",
    "context": "[paste content here]"
  }
}
```

### Extract Data to CSV
```javascript
// 1. Read document
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/path/to/invoice.pdf"
  }
}

// 2. Save data
{
  "name": "append-csv-row",
  "arguments": {
    "filePath": "/data/invoices.csv",
    "row": ["invoice-number", "amount", "date"]
  }
}
```

### Download and Read
```javascript
// 1. Download from website
{
  "name": "browser-navigate",
  "arguments": {
    "url": "https://example.com/document.pdf"
  }
}

// 2. Read downloaded file
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Downloads/document.pdf"
  }
}
```

## 📖 Full Documentation

- **Complete Guide**: [`docs/PDF-TOOLS.md`](docs/PDF-TOOLS.md)
- **Setup Guide**: [`PDF-SETUP.md`](PDF-SETUP.md)
- **Implementation Details**: [`DOCUMENT-TOOLS-COMPLETE.md`](DOCUMENT-TOOLS-COMPLETE.md)

## 🧪 Testing

```bash
# Test PDF tool
npm run test:pdf /path/to/test.pdf

# Test DOCX script directly
python3 scripts/read-docx.py /path/to/test.docx --format markdown

# Verify dependencies
python3 -c "import pypdf, docx; print('✅ Ready!')"
```

## 🎨 Output Formats

### Markdown (Default)
- Structured with headings
- Formatted tables (DOCX)
- Metadata section
- Clean and readable

### Text
- Plain text only
- Simple page/paragraph markers
- Raw content
- Easy to process

## 💡 Tips

1. **Use absolute paths** - `/Users/username/...` not `~/...`
2. **Choose markdown for AI analysis** - Better structure
3. **Choose text for data extraction** - Simpler parsing
4. **DOCX tables** - Automatically formatted in markdown
5. **Word styles** - Heading 1-6 → Markdown headings

## ⚙️ Supported Formats

| Tool | Formats | Output |
|------|---------|--------|
| `read-pdf` | .pdf | text, markdown |
| `read-docx` | .docx, .doc* | text, markdown |

*Note: .doc (old binary format) support is limited

## 🎉 Ready to Use!

Both tools are integrated and ready. Just reload your VS Code window and start reading documents!

---

**Status**: ✅ Installed and Tested  
**Tools**: 2 (PDF + DOCX)  
**Libraries**: pypdf 6.1.3, python-docx 1.2.0
