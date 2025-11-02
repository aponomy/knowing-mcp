# ✨ Feature Update: Save to File Support

## Summary

Both document processing tools (`read-pdf` and `read-docx`) now support an optional `outputPath` parameter that saves the converted content directly to a file instead of returning it in the response.

## Why This Matters

### The Problem
- Large documents can exceed MCP response size limits
- Returning huge content wastes tokens
- Difficult to work with very large responses

### The Solution
- Save output directly to a file in your workspace
- Only metadata is returned in the response
- No size limits - handle documents of any size
- File can be opened and edited in VS Code

## Quick Examples

### Before (Returns Content)
```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/manual.pdf",
    "format": "markdown"
  }
}
// Returns: Full markdown content (can be huge!)
```

### Now (Save to File)  ⭐ NEW
```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/manual.pdf",
    "format": "markdown",
    "outputPath": "/workspace/manual.md"  // ⬅️ NEW PARAMETER
  }
}
// Returns: Metadata only + confirmation
// Content saved to /workspace/manual.md
```

## Works for Both Tools

### PDF to Markdown
```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/report.pdf",
    "outputPath": "/workspace/report.md"
  }
}
```

### DOCX to Markdown
```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/docs/proposal.docx",
    "outputPath": "/workspace/proposal.md"
  }
}
```

## What You Get Back

### With outputPath (Content Saved)
```
📄 **PDF Read Successfully**

**File:** /docs/manual.pdf
**Pages:** 150
**Saved to:** /workspace/manual.md
**File size:** 245678 characters

---

📝 Content has been saved to the file specified. 
Use VS Code to open and view the file.
```

### Without outputPath (Content Returned)
```
📄 **PDF Read Successfully**

**File:** /docs/manual.pdf
**Pages:** 150

---

# Full markdown content here...
[... potentially hundreds of pages ...]
```

## When to Use

### Use `outputPath` (Save to File) For:
- ✅ Large documents (>50KB or >100 pages)
- ✅ Documents you want to keep
- ✅ Batch processing multiple files
- ✅ Creating documentation
- ✅ Version control (commit the .md files)

### Skip `outputPath` (Return Content) For:
- ✅ Small documents (<20 pages)
- ✅ Immediate AI analysis needed
- ✅ Quick one-time extractions
- ✅ Testing/preview

## Features

- ✅ **Auto-creates directories**: `/workspace/outputs/file.md` creates `outputs/` folder
- ✅ **UTF-8 encoding**: Supports international characters
- ✅ **Overwrites existing**: Regenerate files safely
- ✅ **Any format**: Works with both text and markdown formats
- ✅ **No size limits**: Handle documents of any size

## CLI Usage Too!

You can also use the Python scripts directly:

```bash
# Save PDF to markdown
python3 scripts/read-pdf.py document.pdf -o output.md

# Save DOCX to markdown  
python3 scripts/read-docx.py document.docx -o output.md

# Save as text format
python3 scripts/read-pdf.py document.pdf --format text -o output.txt
```

## Documentation

- **Complete Guide**: `SAVE-TO-FILE-FEATURE.md`
- **Tool Reference**: `docs/PDF-TOOLS.md`
- **Setup**: `PDF-SETUP.md`

## Status

✅ **Ready to Use**
- Both scripts updated
- MCP server updated
- Documentation complete
- Syntax validated

## Example Workflow

```javascript
// 1. Convert large PDF to markdown file
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/thesis.pdf",
    "outputPath": "/workspace/thesis.md"
  }
}

// 2. Open /workspace/thesis.md in VS Code

// 3. Read specific sections for analysis

// 4. Use ask-expert on extracted sections
{
  "name": "ask-expert",
  "arguments": {
    "question": "Summarize this section",
    "context": "[paste section from thesis.md]"
  }
}
```

---

**Added**: October 31, 2025  
**Tools**: read-pdf, read-docx  
**Parameter**: `outputPath` (optional string)

🎉 Now you can handle documents of any size!
