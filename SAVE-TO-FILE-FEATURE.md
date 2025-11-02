# Document Processing - Save to File Feature

## 🎉 New Feature: Save Large Documents to Files

Both `read-pdf` and `read-docx` tools now support saving output directly to a file instead of returning the content. This is **highly recommended for large documents** to avoid hitting response size limits.

## Why Use This Feature?

### Problems with Large Documents
- ❌ MCP responses have size limits
- ❌ Very large documents can timeout
- ❌ Large content in chat history wastes tokens
- ❌ Difficult to process huge responses

### Benefits of Saving to File
- ✅ No size limits - handle documents of any size
- ✅ Faster processing - no need to return large content
- ✅ Saves tokens - content stays in file
- ✅ Easy to open in VS Code for viewing/editing
- ✅ Can be version controlled or shared

## Usage

### Basic Usage (Returns Content)

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/path/to/document.pdf",
    "format": "markdown"
  }
}
```

**Returns**: Full markdown content in the response

### Save to File (Recommended for Large Documents)

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/path/to/document.pdf",
    "format": "markdown",
    "outputPath": "/path/to/workspace/document-output.md"
  }
}
```

**Returns**: Metadata and file info only (content saved to file)

## Examples

### Example 1: Convert PDF to Markdown File

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/documents/manual.pdf",
    "format": "markdown",
    "outputPath": "/Users/username/workspace/manual.md"
  }
}
```

**Response:**
```
📄 **PDF Read Successfully**

**File:** /Users/username/documents/manual.pdf
**Pages:** 150
**Saved to:** /Users/username/workspace/manual.md
**File size:** 245678 characters
**Title:** User Manual
**Author:** Tech Team

---

📝 Content has been saved to the file specified. Use VS Code to open and view the file.
```

### Example 2: Convert DOCX to Markdown File

```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/Users/username/documents/report.docx",
    "format": "markdown",
    "outputPath": "/Users/username/workspace/report.md"
  }
}
```

**Response:**
```
📝 **Word Document Read Successfully**

**File:** /Users/username/documents/report.docx
**Paragraphs:** 89
**Tables:** 5
**Saved to:** /Users/username/workspace/report.md
**File size:** 123456 characters
**Title:** Annual Report
**Author:** Finance Team

---

📝 Content has been saved to the file specified. Use VS Code to open and view the file.
```

### Example 3: Extract Text to File

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/Users/username/documents/contract.pdf",
    "format": "text",
    "outputPath": "/Users/username/workspace/contract.txt"
  }
}
```

## When to Use Each Approach

### Use outputPath (Save to File) When:
- ✅ Document is very large (>100 pages or >50KB)
- ✅ You want to keep the content for later reference
- ✅ You want to edit the markdown in VS Code
- ✅ You're processing multiple documents
- ✅ You want to commit the output to git
- ✅ You need to share the converted content

### Return Content (No outputPath) When:
- ✅ Document is small (<20 pages)
- ✅ You need immediate AI analysis
- ✅ Content is temporary/one-time use
- ✅ You want to process content in chat

## Workflow Examples

### Workflow 1: Convert and Edit

```javascript
// 1. Convert DOCX to Markdown and save
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/docs/draft.docx",
    "outputPath": "/workspace/draft.md"
  }
}

// 2. Open the file in VS Code to edit
// 3. Use the edited markdown for further processing
```

### Workflow 2: Batch Processing

```javascript
// Convert multiple PDFs to markdown files
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/doc1.pdf",
    "outputPath": "/workspace/outputs/doc1.md"
  }
}

{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/doc2.pdf",
    "outputPath": "/workspace/outputs/doc2.md"
  }
}

// Now you have a folder of markdown files you can process
```

### Workflow 3: Process Then Analyze

```javascript
// 1. Save large document to file
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/docs/thesis.pdf",
    "outputPath": "/workspace/thesis.md"
  }
}

// 2. Read the saved markdown file (using VS Code read_file)
// 3. Extract specific sections for AI analysis
{
  "name": "ask-expert",
  "arguments": {
    "question": "Summarize the methodology section",
    "context": "[paste extracted section here]"
  }
}
```

### Workflow 4: Create Documentation

```javascript
// Convert Word docs to markdown for documentation site
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/source/user-guide.docx",
    "outputPath": "/docs-site/user-guide.md"
  }
}

{
  "name": "read-docx",
  "arguments": {
    "filePath": "/source/api-reference.docx",
    "outputPath": "/docs-site/api-reference.md"
  }
}
```

## Python CLI Usage

You can also use the scripts directly from command line:

### Save PDF to Markdown File

```bash
python3 scripts/read-pdf.py /path/to/document.pdf \
  --format markdown \
  --output /path/to/output.md
```

### Save DOCX to Text File

```bash
python3 scripts/read-docx.py /path/to/document.docx \
  --format text \
  --output /path/to/output.txt
```

### Use -o Shorthand

```bash
python3 scripts/read-pdf.py document.pdf -o output.md
python3 scripts/read-docx.py document.docx -o output.txt
```

## File Management

### Directory Creation
The tools automatically create directories if they don't exist:

```javascript
{
  "outputPath": "/workspace/outputs/converted/my-doc.md"
}
// Creates /workspace/outputs/converted/ if needed
```

### File Overwriting
If the output file already exists, it will be overwritten:
- ✅ Safe for regenerating files
- ⚠️ Be careful not to overwrite important files

### File Encoding
All files are saved with UTF-8 encoding, ensuring proper support for:
- International characters
- Special symbols
- Emoji
- Mathematical notation

## Response Differences

### With outputPath (File Saved)
```json
{
  "success": true,
  "file_path": "/docs/input.pdf",
  "page_count": 50,
  "saved_to_file": "/workspace/output.md",
  "file_size": 123456,
  "metadata": { ... }
  // NO "text" or "markdown" fields
}
```

### Without outputPath (Content Returned)
```json
{
  "success": true,
  "file_path": "/docs/input.pdf",
  "page_count": 50,
  "metadata": { ... },
  "markdown": "# Full content here...",
  "text": "Full text here..."
}
```

## Best Practices

1. **Use Workspace Paths**
   ```javascript
   // ✅ Good - save to workspace
   "outputPath": "/Users/username/workspace/outputs/doc.md"
   
   // ❌ Avoid - random locations
   "outputPath": "/tmp/doc.md"
   ```

2. **Meaningful Filenames**
   ```javascript
   // ✅ Good
   "outputPath": "/workspace/converted/annual-report-2024.md"
   
   // ❌ Avoid
   "outputPath": "/workspace/doc.md"
   ```

3. **Consistent Format Extension**
   ```javascript
   // ✅ Good
   "format": "markdown",
   "outputPath": "/workspace/doc.md"
   
   // ⚠️ Confusing (works but misleading)
   "format": "markdown",
   "outputPath": "/workspace/doc.txt"
   ```

4. **Organize by Type**
   ```
   /workspace/
     ├── converted/
     │   ├── pdfs/
     │   │   ├── manual.md
     │   │   └── guide.md
     │   └── docx/
     │       ├── report.md
     │       └── proposal.md
     ```

## Limitations

1. **No Streaming**: File is saved after processing completes
2. **No Progress Updates**: For very large files, you won't see progress
3. **Memory Constraints**: Python still needs to load the file in memory
4. **Overwrites**: Existing files are overwritten without warning

## Error Handling

### File Permission Issues
```
Error: Failed to save to file: Permission denied
```
**Solution**: Check write permissions on the output directory

### Invalid Path
```
Error: Failed to save to file: No such file or directory
```
**Solution**: The tool creates directories, but parent directory must exist

### Disk Space
```
Error: Failed to save to file: No space left on device
```
**Solution**: Free up disk space

## Summary

| Feature | Without outputPath | With outputPath |
|---------|-------------------|-----------------|
| **Returns Content** | ✅ Yes | ❌ No (metadata only) |
| **File Saved** | ❌ No | ✅ Yes |
| **Size Limit** | ⚠️ MCP response limit | ✅ No limit |
| **Best For** | Small docs, immediate use | Large docs, persistence |
| **Opens in VS Code** | ❌ No | ✅ Yes (just open the file) |
| **Git Friendly** | ❌ No | ✅ Yes |

---

**Added**: October 31, 2025  
**Applies to**: read-pdf, read-docx  
**Status**: ✅ Ready to Use
