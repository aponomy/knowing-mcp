# Markdown Tools Examples

Practical examples of using the Markdown tools in **knowing-mcp**.

## Quick Start

### 1. Check File Structure

Before making any edits, analyze the file:

```json
{
  "name": "md-stat",
  "arguments": {
    "file": "/Users/username/project/README.md"
  }
}
```

**Response shows**:
- SHA-256 hash (needed for edits)
- Section hierarchy
- Code block locations
- Tables and front matter

### 2. Preview Changes (Dry Run)

Always preview before applying:

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "abc123def456...",
    "dryRun": true,
    "edits": [
      {
        "op": "replace_section",
        "headingPath": ["Installation"],
        "markdown": "## Installation\n\n```bash\nnpm install my-package\n```\n"
      }
    ]
  }
}
```

**Shows unified diff** without writing.

### 3. Apply Changes

If preview looks good, apply:

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "abc123def456...",
    "dryRun": false,
    "edits": [ /* same edits */ ]
  }
}
```

---

## Common Use Cases

### Use Case 1: Update Installation Instructions

**Goal**: Replace outdated installation steps.

**Step 1** - Analyze file:
```json
{
  "name": "md-stat",
  "arguments": {
    "file": "/Users/username/project/README.md"
  }
}
```

**Step 2** - Replace section:
```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_section",
        "headingPath": ["Installation"],
        "markdown": "## Installation\n\n### Using npm\n\n```bash\nnpm install my-package\n```\n\n### Using yarn\n\n```bash\nyarn add my-package\n```\n",
        "keepSubsections": false
      }
    ]
  }
}
```

**Result**: Entire Installation section is replaced with new content.

---

### Use Case 2: Update Version Numbers

**Goal**: Bump version from 1.0.0 to 2.0.0 across documentation.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/CHANGELOG.md",
    "baseSha256": "obtained-from-md-stat",
    "atomic": true,
    "edits": [
      {
        "op": "update_front_matter",
        "set": {
          "version": "2.0.0",
          "date": "2025-11-01"
        }
      },
      {
        "op": "replace_match",
        "pattern": "1\\.0\\.0",
        "literal": false,
        "flags": "g",
        "occurrence": "all",
        "expectedMatches": 5,
        "codeBlocks": "exclude",
        "replacement": "2.0.0"
      }
    ]
  }
}
```

**Safety**: `expectedMatches: 5` ensures exactly 5 occurrences are found. If file has more or fewer, edit fails.

---

### Use Case 3: Add Warning Banner

**Goal**: Add a deprecation notice at the top of a section.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/docs/old-api.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "insert_after_heading",
        "headingPath": ["Old API"],
        "position": "afterHeading",
        "ensureBlankLine": true,
        "markdown": "> **⚠️ DEPRECATED**: This API is deprecated. Use the [new API](./new-api.md) instead.\n"
      }
    ]
  }
}
```

**Result**:
```markdown
# Old API

> **⚠️ DEPRECATED**: This API is deprecated. Use the [new API](./new-api.md) instead.

(existing content...)
```

---

### Use Case 4: Fix Links Site-Wide

**Goal**: Update all HTTP links to HTTPS.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_match",
        "pattern": "http://example\\.com",
        "literal": false,
        "occurrence": "all",
        "linksAndImages": "allow",
        "codeBlocks": "exclude",
        "replacement": "https://example.com"
      }
    ]
  }
}
```

**Key**: `linksAndImages: "allow"` lets you target links (normally excluded).

---

### Use Case 5: Update Code Examples

**Goal**: Update API examples in a specific section only.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/docs/api.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_match",
        "pattern": "api\\.v1\\.",
        "literal": false,
        "occurrence": "all",
        "scope": {
          "kind": "section",
          "headingPath": ["API Examples"],
          "includeSubsections": true
        },
        "codeBlocks": "only",
        "replacement": "api.v2."
      }
    ]
  }
}
```

**Key**: `codeBlocks: "only"` restricts replacement to code blocks.

---

### Use Case 6: Reformat Document

**Goal**: Apply consistent formatting to entire document.

**Step 1** - Preview formatting:
```json
{
  "name": "md-validate",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "autofixPreview": true
  }
}
```

**Step 2** - Apply formatting:
```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "format": "mdformat",
    "edits": []
  }
}
```

**Result**: File is reformatted using mdformat (GFM-compatible).

---

### Use Case 7: Add New Section

**Goal**: Insert a new section between existing sections.

**Strategy**: Use `insert_after_heading` with `position: "end"`.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "insert_after_heading",
        "headingPath": ["Installation"],
        "position": "end",
        "markdown": "\n## Configuration\n\nConfigure the tool using `config.json`:\n\n```json\n{\n  \"option\": \"value\"\n}\n```\n"
      }
    ]
  }
}
```

**Result**: New "Configuration" section added after "Installation" section.

---

### Use Case 8: Update Table of Contents

**Goal**: Update TOC links after renaming sections.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_match",
        "pattern": "\\[Getting Started\\]\\(#getting-started\\)",
        "literal": false,
        "occurrence": "all",
        "scope": {
          "kind": "section",
          "headingPath": ["Table of Contents"]
        },
        "tables": "allow",
        "replacement": "[Quick Start](#quick-start)"
      }
    ]
  }
}
```

---

### Use Case 9: Multi-Document Update

**Goal**: Update copyright year across multiple files.

**Pattern**: Call `md-apply` for each file with same edits.

```javascript
// Pseudo-code showing pattern
const files = [
  "/Users/username/project/README.md",
  "/Users/username/project/LICENSE.md",
  "/Users/username/project/CONTRIBUTING.md"
];

for (const file of files) {
  // 1. Get stat
  const stat = await mdStat(file);
  
  // 2. Apply edit
  await mdApply({
    file,
    baseSha256: stat.contentSha256,
    edits: [
      {
        op: "replace_match",
        pattern: "Copyright 2024",
        literal: true,
        occurrence: "all",
        replacement: "Copyright 2025"
      }
    ]
  });
}
```

---

## Advanced Examples

### Example 1: Conditional Section Update

**Goal**: Replace section only if it contains specific text.

**Strategy**: Use `expectedText` in `replace_range` or `expectedMatches` in `replace_match`.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/README.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_match",
        "pattern": "BETA: This feature is experimental",
        "literal": true,
        "occurrence": 1,
        "expectedMatches": 1,
        "scope": {
          "kind": "section",
          "headingPath": ["New Feature"]
        },
        "replacement": "STABLE: This feature is production-ready"
      }
    ]
  }
}
```

**Behavior**: Fails if "BETA: This feature is experimental" doesn't appear exactly once.

---

### Example 2: Preserve Subsections

**Goal**: Update section intro but keep subsections.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/docs/guide.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_section",
        "headingPath": ["Installation"],
        "markdown": "## Installation\n\nChoose your platform:\n\n",
        "keepSubsections": true
      }
    ]
  }
}
```

**Before**:
```markdown
## Installation

Old intro text

### macOS
Install on macOS...

### Windows
Install on Windows...
```

**After**:
```markdown
## Installation

Choose your platform:

### macOS
Install on macOS...

### Windows
Install on Windows...
```

---

### Example 3: Atomic Multi-File Operation

**Goal**: Update version in package.json and README.md atomically (conceptually).

**Note**: Each file needs its own `md-apply` call, but you can implement atomic logic in your calling code.

```javascript
// Pseudo-code
async function atomicVersionUpdate(version) {
  const files = [
    { path: "README.md", sha: null },
    { path: "CHANGELOG.md", sha: null }
  ];
  
  // 1. Get all stats
  for (const file of files) {
    const stat = await mdStat(file.path);
    file.sha = stat.contentSha256;
  }
  
  // 2. Dry-run all
  const previews = [];
  for (const file of files) {
    const result = await mdApply({
      file: file.path,
      baseSha256: file.sha,
      dryRun: true,
      edits: [/* version update edits */]
    });
    previews.push(result);
  }
  
  // 3. Review previews, then apply all
  for (const file of files) {
    await mdApply({
      file: file.path,
      baseSha256: file.sha,
      dryRun: false,
      edits: [/* version update edits */]
    });
  }
}
```

---

### Example 4: Complex Regex Replacement

**Goal**: Update all semantic version strings.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/CHANGELOG.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "replace_match",
        "pattern": "v?(\\d+)\\.(\\d+)\\.(\\d+)",
        "literal": false,
        "flags": "g",
        "occurrence": "all",
        "codeBlocks": "exclude",
        "replacement": "v2.0.0"
      }
    ]
  }
}
```

**Note**: Be careful with regex - always test with `dryRun: true` first!

---

### Example 5: Update Metadata Only

**Goal**: Update document front matter without touching content.

```json
{
  "name": "md-apply",
  "arguments": {
    "file": "/Users/username/project/blog/post.md",
    "baseSha256": "obtained-from-md-stat",
    "edits": [
      {
        "op": "update_front_matter",
        "set": {
          "title": "Updated Post Title",
          "date": "2025-11-01",
          "updated": "2025-11-01",
          "tags": ["markdown", "tools", "mcp"],
          "featured": true
        },
        "remove": ["draft", "wip"]
      }
    ]
  }
}
```

**Result**:
```yaml
---
title: Updated Post Title
date: 2025-11-01
updated: 2025-11-01
tags:
  - markdown
  - tools
  - mcp
featured: true
---
```

---

## Error Recovery Examples

### Example 1: SHA Mismatch

**Error**:
```
❌ Edit Failed: PRECONDITION_FAILED
SHA-256 mismatch (file changed)
```

**Solution**: Re-run `md-stat` to get new hash:
```json
{
  "name": "md-stat",
  "arguments": {
    "file": "/Users/username/project/README.md"
  }
}
```

---

### Example 2: No Matches Found

**Error**:
```
❌ Edit Failed: NO_MATCH
Found 0 matches (expected 3)
```

**Solution 1**: Check pattern spelling
**Solution 2**: Verify scope (maybe it's in a different section)
**Solution 3**: Remove `expectedMatches` constraint

```json
{
  "op": "replace_match",
  "pattern": "corrected-pattern",
  "occurrence": "all",
  // Remove: "expectedMatches": 3
  "replacement": "new value"
}
```

---

### Example 3: Unbalanced Fence

**Error**:
```
❌ Edit Failed: MARKDOWN_BROKEN
Unbalanced code fence (1 unclosed)
```

**Solution**: Validate file first:
```json
{
  "name": "md-validate",
  "arguments": {
    "file": "/Users/username/project/README.md"
  }
}
```

Then manually fix the fence in the source file.

---

## Testing Patterns

### Test Pattern 1: Validate Before Edit

Always validate complex documents first:

```bash
# 1. Validate
md-validate → check for errors

# 2. Get stat
md-stat → get structure and hash

# 3. Dry-run edit
md-apply (dryRun=true) → preview

# 4. Apply
md-apply (dryRun=false) → write
```

---

### Test Pattern 2: Use Small Scopes

Test replacements on small sections first:

```json
{
  "scope": {
    "kind": "section",
    "headingPath": ["Test Section"],
    "includeSubsections": false
  }
}
```

Then expand to larger scopes once verified.

---

### Test Pattern 3: expectedMatches Guard

Always use `expectedMatches` for safety:

```json
{
  "op": "replace_match",
  "pattern": "search term",
  "expectedMatches": 2,
  "replacement": "replacement"
}
```

Fails loudly if unexpected matches found.

---

## Integration Examples

### Example: CI/CD Version Bump

```bash
#!/bin/bash
# Script to bump version in documentation

NEW_VERSION="2.0.0"
OLD_VERSION="1.0.0"

# Get current SHA
STAT=$(python3 scripts/markdown-tools.py stat --file README.md)
SHA=$(echo "$STAT" | jq -r '.contentSha256')

# Apply version bump
python3 scripts/markdown-tools.py apply \
  --file README.md \
  --base-sha256 "$SHA" \
  --edits "[
    {
      \"op\": \"replace_match\",
      \"pattern\": \"$OLD_VERSION\",
      \"literal\": true,
      \"occurrence\": \"all\",
      \"codeBlocks\": \"exclude\",
      \"replacement\": \"$NEW_VERSION\"
    }
  ]"
```

---

### Example: Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Validate markdown before commit

for file in $(git diff --cached --name-only | grep '.md$'); do
  echo "Validating $file..."
  
  RESULT=$(python3 scripts/markdown-tools.py validate --file "$file")
  
  if echo "$RESULT" | jq -e '.diagnostics[] | select(.severity == "error")' > /dev/null; then
    echo "❌ Markdown validation failed for $file"
    echo "$RESULT" | jq '.diagnostics'
    exit 1
  fi
done

echo "✅ All markdown files valid"
```

---

## Next Steps

- Read [MARKDOWN-TOOLS.md](./MARKDOWN-TOOLS.md) for complete documentation
- See [QUICK-START.md](../QUICK-START.md) for general MCP setup
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
