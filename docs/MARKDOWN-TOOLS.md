# Markdown Tools Documentation

## Overview

The **knowing-mcp** Markdown tools provide deterministic, Markdown-aware editing capabilities through the Model Context Protocol (MCP). These tools enable safe, structural edits to Markdown files with preconditions, validation, and atomic transactions.

## Features

- **Deterministic & Idempotent**: Every edit applies exactly the intended change or fails with a clear reason
- **Markdown-Aware**: Respects code fences, lists, tables, and YAML front matter
- **Safe by Default**: Preconditions, dry-run mode, and atomic transactions prevent accidental damage
- **Composable**: Small set of orthogonal operations covering 95% of use cases
- **Structural Editing**: Section-based operations rather than fragile text replacements

## Installation

Install the required Python dependencies:

```bash
pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

These libraries provide:
- **markdown-it-py**: CommonMark/GFM parser for structural analysis
- **pyyaml**: YAML front matter handling
- **mdformat** + **mdformat-gfm**: Optional formatting support

## The Three Tools

### 1. `md-stat` (Read-Only)

Get file metadata and structural index.

**Purpose**: Analyze file structure and get `baseSha256` hash before editing.

**Input**:
```json
{
  "file": "/path/to/document.md"
}
```

**Output**:
- File metadata (SHA-256, encoding, line endings, line count)
- Section hierarchy (headings with line ranges)
- Code block locations and languages
- Table locations
- Front matter presence and content

**Example**:
```json
{
  "file": "/Users/username/docs/README.md"
}
```

**Response**:
```
📊 **Markdown File Analysis**

**File:** /Users/username/docs/README.md
**SHA-256:** `a1b2c3d4...`
**Encoding:** utf-8
**Line Endings:** LF
**Lines:** 150
**Sections:** 8
**Code Blocks:** 3
**Tables:** 2
**Front Matter:** Yes

### Sections
- Installation (lines 10-25)
  - macOS (lines 12-18)
  - Windows (lines 19-25)
- Usage (lines 26-80)
```

### 2. `md-validate` (Read-Only)

Validate and lint without writing.

**Purpose**: Check for syntax errors, unbalanced fences, and preview formatting changes.

**Input**:
```json
{
  "file": "/path/to/document.md",
  "autofixPreview": true  // optional
}
```

**Output**:
- Validation diagnostics (errors, warnings)
- Optional format preview (what mdformat would change)

**Example**:
```json
{
  "file": "/Users/username/docs/README.md",
  "autofixPreview": true
}
```

### 3. `md-apply` (Write)

Apply edits with preconditions and validation.

**Purpose**: Make structural changes safely with atomic transactions.

**Input**:
```json
{
  "file": "/path/to/document.md",
  "baseSha256": "hash-from-md-stat",
  "atomic": true,
  "dryRun": false,
  "format": "none",
  "edits": [ /* edit operations */ ]
}
```

**Key Parameters**:
- **baseSha256** (required): Hash from `md-stat` - ensures file hasn't changed
- **atomic** (default: true): All edits succeed or none are applied
- **dryRun** (default: false): Show diff without writing
- **format** (default: "none"): Apply mdformat after edits ("none" | "mdformat")
- **edits**: Array of edit operations (see below)

## Edit Operations

### 1. `replace_range`

Replace text at specific line/column positions.

**Use When**: You have exact positions and want precise control.

**Schema**:
```json
{
  "op": "replace_range",
  "range": {
    "start": { "line": 10, "col": 0 },
    "end": { "line": 12, "col": 15 }
  },
  "expectedText": "current text",  // optional but recommended
  "replacement": "new text"
}
```

**Example**: Replace a specific paragraph:
```json
{
  "op": "replace_range",
  "range": {
    "start": { "line": 5, "col": 0 },
    "end": { "line": 7, "col": 0 }
  },
  "expectedText": "This is old content.\n\nMore old content.\n",
  "replacement": "This is new content.\n\n"
}
```

### 2. `replace_match`

Find and replace with scope constraints.

**Use When**: You want controlled find/replace within specific sections, excluding code blocks.

**Schema**:
```json
{
  "op": "replace_match",
  "pattern": "search pattern",
  "literal": true,  // false for regex
  "flags": "",  // regex flags: "i", "m", "s"
  "occurrence": "all",  // or 1, 2, 3...
  "expectedMatches": 3,  // optional safety check
  "scope": {
    "kind": "whole_document"  // or "section"
  },
  "codeBlocks": "exclude",  // "exclude" | "only" | "allow"
  "linksAndImages": "exclude",  // "exclude" | "allow"
  "tables": "exclude",  // "exclude" | "allow"
  "replacement": "replacement text"
}
```

**Example 1**: Replace version number in a section, avoiding code blocks:
```json
{
  "op": "replace_match",
  "pattern": "0.8.x",
  "literal": true,
  "occurrence": "all",
  "expectedMatches": 3,
  "scope": {
    "kind": "section",
    "headingPath": ["Installation"],
    "includeSubsections": false
  },
  "codeBlocks": "exclude",
  "replacement": "0.9.x"
}
```

**Example 2**: Update all links in entire document:
```json
{
  "op": "replace_match",
  "pattern": "http://example.com",
  "literal": true,
  "occurrence": "all",
  "linksAndImages": "allow",
  "replacement": "https://example.com"
}
```

### 3. `replace_section`

Replace entire section content.

**Use When**: You want to rewrite a section under a specific heading.

**Schema**:
```json
{
  "op": "replace_section",
  "headingPath": ["Installation", "macOS"],
  "markdown": "## macOS\n\nNew content here...\n",
  "keepSubsections": false
}
```

**Example**: Rewrite the Installation section:
```json
{
  "op": "replace_section",
  "headingPath": ["Installation"],
  "markdown": "## Installation\n\n1. Install the package:\n   ```bash\n   npm install foo\n   ```\n\n2. Run setup:\n   ```bash\n   foo init\n   ```\n",
  "keepSubsections": false
}
```

**Heading Path Explained**: `["Installation", "macOS"]` means:
```markdown
# Installation      ← First level
## macOS            ← Second level (target)
```

### 4. `insert_after_heading`

Insert content after a heading.

**Use When**: You want to add content to a section without replacing existing content.

**Schema**:
```json
{
  "op": "insert_after_heading",
  "headingPath": ["Installation"],
  "position": "afterHeading",  // "afterHeading" | "start" | "end"
  "ensureBlankLine": true,
  "markdown": "New content to insert\n"
}
```

**Example**: Add a note at the start of a section:
```json
{
  "op": "insert_after_heading",
  "headingPath": ["Installation"],
  "position": "afterHeading",
  "ensureBlankLine": true,
  "markdown": "> **Note**: This feature is experimental.\n"
}
```

### 5. `update_front_matter`

Update YAML front matter.

**Use When**: You need to modify document metadata.

**Schema**:
```json
{
  "op": "update_front_matter",
  "set": {
    "title": "New Title",
    "date": "2025-10-31",
    "tags": ["foo", "bar"]
  },
  "remove": ["deprecated_field"]
}
```

**Example**: Update version and add tag:
```json
{
  "op": "update_front_matter",
  "set": {
    "version": "2.0.0",
    "updated": "2025-10-31"
  },
  "remove": ["draft"]
}
```

## Workflow Patterns

### Pattern 1: Safe Section Update

**Goal**: Update a section with validation.

```
1. md-stat → get baseSha256 and section list
2. md-apply (dryRun=true) → preview changes
3. Review diff
4. md-apply (dryRun=false) → apply changes
```

**Example**:

Step 1 - Analyze file:
```json
{
  "file": "/path/to/README.md"
}
```

Step 2 - Preview edit:
```json
{
  "file": "/path/to/README.md",
  "baseSha256": "abc123...",
  "dryRun": true,
  "edits": [
    {
      "op": "replace_section",
      "headingPath": ["Installation"],
      "markdown": "## Installation\n\nNew instructions...\n"
    }
  ]
}
```

Step 3 - Apply if preview looks good:
```json
{
  "file": "/path/to/README.md",
  "baseSha256": "abc123...",
  "dryRun": false,
  "edits": [ /* same edits */ ]
}
```

### Pattern 2: Atomic Multi-Edit

**Goal**: Apply multiple related changes atomically.

```json
{
  "file": "/path/to/README.md",
  "baseSha256": "abc123...",
  "atomic": true,
  "edits": [
    {
      "op": "update_front_matter",
      "set": { "version": "2.0.0" }
    },
    {
      "op": "replace_match",
      "pattern": "1.0.0",
      "literal": true,
      "occurrence": "all",
      "codeBlocks": "exclude",
      "replacement": "2.0.0"
    },
    {
      "op": "replace_section",
      "headingPath": ["Changelog"],
      "markdown": "## Changelog\n\n### 2.0.0\n\n- Major update\n",
      "keepSubsections": true
    }
  ]
}
```

If **any** edit fails, **none** are applied (atomic=true).

### Pattern 3: Constrained Find/Replace

**Goal**: Replace text only in specific sections, excluding code.

```json
{
  "file": "/path/to/docs.md",
  "baseSha256": "abc123...",
  "edits": [
    {
      "op": "replace_match",
      "pattern": "old-api-name",
      "literal": true,
      "occurrence": "all",
      "expectedMatches": 5,
      "scope": {
        "kind": "section",
        "headingPath": ["API Reference"],
        "includeSubsections": true
      },
      "codeBlocks": "exclude",
      "tables": "exclude",
      "replacement": "new-api-name"
    }
  ]
}
```

**Safety**: If not exactly 5 matches, edit fails (prevents accidental over-replacement).

## Error Handling

The tools use explicit error codes for clear diagnostics:

- **PRECONDITION_FAILED**: SHA-256 mismatch or expectedText mismatch
- **NO_MATCH**: Pattern not found
- **AMBIGUOUS_MATCH**: Found more matches than expected
- **OUT_OF_RANGE**: Invalid line/column positions
- **MARKDOWN_BROKEN**: Unbalanced fences or invalid structure
- **MARKDOWN_LINT_ERROR**: Linting failed with errors
- **IO_ERROR**: File not found or read/write error
- **ENCODING_ERROR**: Encoding issues
- **CONFLICTING_EDITS**: Edits conflict with each other

**Example Error Response**:
```
❌ **Edit Failed: PRECONDITION_FAILED**

SHA-256 mismatch (file changed)

Expected: abc123...
Actual: def456...
```

## Best Practices

### 1. Always Use md-stat First

Get the current state and `baseSha256`:

```json
{ "file": "/path/to/file.md" }
```

### 2. Use Dry-Run for Complex Edits

Preview changes before applying:

```json
{
  "dryRun": true,
  "edits": [ /* ... */ ]
}
```

### 3. Set expectedMatches for Safety

Prevent over-replacement:

```json
{
  "op": "replace_match",
  "pattern": "foo",
  "expectedMatches": 3,  // Fail if not exactly 3
  "replacement": "bar"
}
```

### 4. Use Section Scopes

Limit blast radius:

```json
{
  "scope": {
    "kind": "section",
    "headingPath": ["Installation"]
  }
}
```

### 5. Exclude Code Blocks by Default

Avoid breaking code:

```json
{
  "codeBlocks": "exclude"  // default
}
```

### 6. Use Atomic Mode for Related Changes

All succeed or all fail:

```json
{
  "atomic": true,
  "edits": [ /* multiple edits */ ]
}
```

## Formatting

### Auto-Format After Edits

```json
{
  "format": "mdformat",
  "edits": [ /* ... */ ]
}
```

This runs **mdformat** with GFM support after applying edits.

### Preview Formatting Only

Use `md-validate`:

```json
{
  "file": "/path/to/file.md",
  "autofixPreview": true
}
```

Shows what mdformat would change **without writing**.

## Comparison to replace_string_in_file

| Feature | replace_string_in_file | md-apply |
|---------|------------------------|----------|
| **Markdown-aware** | ❌ No | ✅ Yes |
| **Preconditions** | ❌ No | ✅ SHA-256 + expectedText |
| **Scope control** | ❌ Global only | ✅ Section-level |
| **Code block safety** | ❌ No | ✅ Exclude by default |
| **Atomic transactions** | ❌ No | ✅ Yes |
| **Dry-run mode** | ❌ No | ✅ Yes |
| **Sequential rebase** | ❌ No (breaks on multi-edit) | ✅ Yes |
| **Structural edits** | ❌ Text-only | ✅ Sections, front matter |
| **Validation** | ❌ No | ✅ Fence/lint checking |

## Troubleshooting

### Import Errors

```bash
# Install all dependencies
pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

### SHA-256 Mismatch

File changed between `md-stat` and `md-apply`. Re-run `md-stat`.

### Unbalanced Fences

Run `md-validate` to find the issue:

```json
{ "file": "/path/to/file.md" }
```

### No Matches Found

Pattern doesn't exist in scope. Check:
- Pattern spelling
- Scope (whole_document vs section)
- Code block exclusion

## Advanced Usage

### Custom Regex Replacements

```json
{
  "op": "replace_match",
  "pattern": "v\\d+\\.\\d+\\.\\d+",
  "literal": false,  // regex mode
  "flags": "g",
  "occurrence": "all",
  "codeBlocks": "exclude",
  "replacement": "v2.0.0"
}
```

### Multi-Level Section Paths

```json
{
  "headingPath": ["Documentation", "API", "Authentication"]
}
```

Targets:
```markdown
# Documentation
## API
### Authentication  ← This section
```

### Preserve Subsections

```json
{
  "op": "replace_section",
  "headingPath": ["Installation"],
  "markdown": "## Installation\n\nNew intro...\n",
  "keepSubsections": true  // Keep "macOS", "Windows", etc.
}
```

## See Also

- [MCP Specification - Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [markdown-it-py Documentation](https://markdown-it-py.readthedocs.io/)
- [mdformat Documentation](https://mdformat.readthedocs.io/)
- [CommonMark Spec](https://spec.commonmark.org/)
