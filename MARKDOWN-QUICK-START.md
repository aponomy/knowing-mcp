# Markdown Tools - Quick Start

Get started with the Markdown editing tools in **knowing-mcp** in 5 minutes.

## 1. Install Python Dependencies

```bash
pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

**Or install all knowing-mcp Python dependencies**:

```bash
pip install -r requirements.txt
```

## 2. Verify Installation

```bash
python3 -c "import markdown_it, yaml; print('✅ Ready to use!')"
```

## 3. Test the Tools

```bash
cd /path/to/knowing-mcp
npm run test:markdown
```

Expected output:
```
🧪 Testing Markdown Tools
✅ md-stat succeeded
✅ md-validate succeeded
✅ md-apply (dry-run) succeeded
✅ md-apply (live) succeeded
...
🎉 All tests passed!
```

## 4. Use in VS Code Copilot

Open any workspace and try these commands in Copilot Chat:

### Analyze a File

```
@workspace Analyze README.md structure with md-stat
```

### Validate Markdown

```
@workspace Validate docs/API.md for syntax errors
```

### Update a Section

```
@workspace Update the Installation section in README.md to include:
- npm install
- yarn add
```

### Replace Text Safely

```
@workspace Replace all instances of "version 1.0" with "version 2.0" 
in README.md, but exclude code blocks
```

## Common Operations

### Get File Info

```json
{
  "name": "md-stat",
  "arguments": {
    "file": "/path/to/file.md"
  }
}
```

Returns: SHA-256, sections, code blocks, tables, front matter

### Preview Changes

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/path/to/file.md",
    "baseSha256": "hash-from-md-stat",
    "dryRun": true,
    "edits": [{
      "op": "replace_section",
      "headingPath": ["Installation"],
      "markdown": "## Installation\n\nNew content...\n"
    }]
  }
}
```

Returns: Unified diff preview (no changes written)

### Apply Changes

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/path/to/file.md",
    "baseSha256": "hash-from-md-stat",
    "dryRun": false,
    "edits": [ /* same edits */ ]
  }
}
```

Returns: Applied changes with new SHA-256

## Five Edit Operations

### 1. Replace Section

```json
{
  "op": "replace_section",
  "headingPath": ["Installation"],
  "markdown": "## Installation\n\n..."
}
```

### 2. Replace Match

```json
{
  "op": "replace_match",
  "pattern": "1.0.0",
  "literal": true,
  "occurrence": "all",
  "expectedMatches": 3,
  "codeBlocks": "exclude",
  "replacement": "2.0.0"
}
```

### 3. Insert After Heading

```json
{
  "op": "insert_after_heading",
  "headingPath": ["Features"],
  "markdown": "> **Note**: Experimental\n"
}
```

### 4. Update Front Matter

```json
{
  "op": "update_front_matter",
  "set": { "version": "2.0.0" }
}
```

### 5. Replace Range

```json
{
  "op": "replace_range",
  "range": {
    "start": { "line": 5, "col": 0 },
    "end": { "line": 8, "col": 0 }
  },
  "replacement": "New content"
}
```

## Safety Features

✅ **SHA-256 Preconditions**: File must not change between stat and apply

✅ **Dry-Run Mode**: Preview changes before applying

✅ **Atomic Transactions**: All edits succeed or none applied

✅ **Code Block Safety**: Excludes code blocks by default

✅ **Expected Matches**: Fails if match count differs

✅ **Section Scopes**: Limit blast radius to specific sections

## Common Patterns

### Pattern 1: Safe Update

```bash
# 1. Get current state
md-stat → SHA-256

# 2. Preview
md-apply (dryRun=true) → Show diff

# 3. Apply
md-apply (dryRun=false) → Write changes
```

### Pattern 2: Version Bump

```json
{
  "atomic": true,
  "edits": [
    { "op": "update_front_matter", "set": { "version": "2.0.0" } },
    { "op": "replace_match", "pattern": "1.0.0", "replacement": "2.0.0" }
  ]
}
```

### Pattern 3: Section-Only Replace

```json
{
  "op": "replace_match",
  "scope": {
    "kind": "section",
    "headingPath": ["API Reference"]
  },
  "pattern": "oldApi",
  "replacement": "newApi"
}
```

## Troubleshooting

### "markdown-it-py not installed"

```bash
pip install markdown-it-py
```

### "SHA-256 mismatch"

File changed between `md-stat` and `md-apply`. Re-run `md-stat` to get new hash.

### "No matches found"

- Check pattern spelling
- Verify scope (might be in different section)
- Check code block exclusion

### "Unbalanced fence"

Run `md-validate` to find the issue, then fix manually.

## Next Steps

- 📖 Read [MARKDOWN-TOOLS.md](docs/MARKDOWN-TOOLS.md) for complete reference
- 💡 See [MARKDOWN-EXAMPLES.md](docs/MARKDOWN-EXAMPLES.md) for more examples
- 🔧 Check [MARKDOWN-SETUP.md](docs/MARKDOWN-SETUP.md) for detailed setup

## Resources

- **Complete Documentation**: [docs/MARKDOWN-TOOLS.md](docs/MARKDOWN-TOOLS.md)
- **Examples**: [docs/MARKDOWN-EXAMPLES.md](docs/MARKDOWN-EXAMPLES.md)
- **Setup Guide**: [docs/MARKDOWN-SETUP.md](docs/MARKDOWN-SETUP.md)
- **Test Suite**: `npm run test:markdown`
- **Requirements**: [requirements.txt](requirements.txt)

---

**You're ready to use the Markdown tools!** 🎉

Try them out in VS Code Copilot or via the MCP server directly.
