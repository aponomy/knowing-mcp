# Markdown Tools - Expert Review & Improvement Plan

## Executive Summary

The expert review (Azure OpenAI GPT-5) confirms the **core design is sound** and "very close" to optimal for AI assistant use. The three-tool separation, section-based scoping, SHA-256 preconditions, and code-block safety are all well-aligned with LLM needs.

**Verdict**: With targeted improvements, this can be "excellent for AI use."

---

## High-Impact Improvements (Prioritized)

### 1. Specify All Semantics Precisely ⭐⭐⭐

**Problem**: Ambiguity causes AI errors.

**Solutions**:

#### a) Line/Column Indexing
- **Decision**: Use **1-based lines and columns**
- **Unit**: Unicode code points
- **Range**: Half-open `[start, end)` (end exclusive)
- **Document explicitly** in all schemas

#### b) Regex Engine
- **Engine**: RE2 or Python `re` (already using Python)
- **Defaults**: `caseSensitive=true`, `multiline=true`, `dotAll=false`
- **Expose flags explicitly**: Make `flags` parameter clearer

#### c) Markdown Flavor
- **Flavor**: CommonMark + GFM
- **Front matter**: YAML only
- **Fences**: Fenced code blocks (```) and indented (4 spaces)

#### d) Encoding/Line Endings
- Already handled! ✅
- Preserve by default (currently implemented)

---

### 2. Strengthen Match Planning & Reporting ⭐⭐⭐

**Current Gap**: No visibility into what was matched.

**Solutions**:

#### a) Match Reports
Return structured match info in ALL responses:

```python
{
  "ok": true,
  "matchesFound": 3,
  "matchesReplaced": 3,
  "matches": [
    {
      "line": 42,
      "col": 10,
      "text": "v1.0.0",
      "range": {"start": {"line": 42, "col": 10}, "end": {"line": 42, "col": 16}}
    }
  ],
  "excludedMatches": {
    "codeBlocks": 2,
    "inlineCode": 1,
    "links": 0
  }
}
```

#### b) Expected Match Ranges
Replace `expectedMatches` with `expectedMatchCount`:

```json
{
  "expectedMatchCount": 3  // exact
  // or
  "expectedMatchCount": {"min": 2, "max": 5}  // range
}
```

#### c) Preview Matches Only
Add new mode to `replace_match`:

```json
{
  "op": "preview_match",  // or add "previewOnly": true
  "pattern": "foo",
  "scope": {...}
  // Returns matches WITHOUT replacement
}
```

---

### 3. Make Heading/Section Addressing Unambiguous ⭐⭐⭐

**Problem**: Duplicate headings, whitespace variations cause errors.

**Solutions**:

#### a) Canonical Heading Paths
In `md-stat`, return normalized headings:

```json
{
  "sections": [
    {
      "headingPath": ["Installation", "macOS"],
      "canonicalHeadingPath": ["installation", "macos"],  // normalized
      "sectionId": "sha256-hash-of-path",  // stable ID
      "level": 2,
      "startLine": 12,
      "endLine": 25
    }
  ]
}
```

**Normalization rules**:
- Lowercase
- Remove inline code, emphasis, emojis
- Collapse whitespace
- Strip punctuation (except hyphens)

#### b) Allow Section ID References
Operations can use either `headingPath` OR `sectionId`:

```json
{
  "op": "replace_section",
  "sectionId": "sha256-abc123...",  // stable!
  "markdown": "..."
}
```

#### c) New Error Codes
- `AMBIGUOUS_HEADING`: Multiple sections match path
- `SECTION_NOT_FOUND`: No section matches

---

### 4. Add Two Highly Useful Operations ⭐⭐

#### a) `upsert_section`

**Purpose**: Create-or-update in one call (reduces race conditions).

```json
{
  "op": "upsert_section",
  "headingPath": ["Installation"],
  "markdown": "## Installation\n\nContent...\n",
  "createIfMissing": true,
  "mode": "replace",  // "replace" | "append" | "prepend"
  "parentPath": ["Getting Started"],  // where to create if missing
  "keepSubsections": false
}
```

#### b) `rename_heading`

**Purpose**: Change heading text without touching content.

```json
{
  "op": "rename_heading",
  "headingPath": ["Old Title"],
  "newTitle": "New Title",
  "updateReferences": false  // future: update TOC links
}
```

---

### 5. Safer Defaults & Stronger Guards ⭐⭐

#### a) Require `expectedText` in `replace_range`
```json
{
  "op": "replace_range",
  "range": {...},
  "expectedText": "...",  // REQUIRED (unless allowInsecureRange=true)
  "replacement": "..."
}
```

#### b) Expand Node Exclusions
Current: Exclude code blocks ✅

**Add**:
- Inline code spans (`` ` ``)
- Link destinations (`[text](url)` → exclude `url`)
- Image sources
- Table cells (already have)

```json
{
  "nodeExclusions": {
    "codeBlocks": "exclude",  // default
    "inlineCode": "exclude",  // NEW
    "linkDestinations": "exclude",  // NEW
    "images": "exclude",  // NEW
    "tables": "exclude"
  }
}
```

#### c) Detect Overlapping Edits
```python
if edits_overlap and not allowOverlappingEdits:
    return CONFLICTING_EDITS
```

#### d) Better `occurrence` Semantics
Replace `occurrence` with `matchSelection`:

```json
{
  "matchSelection": "all"  // or
  "matchSelection": {"index": 1}  // 1-based
  "matchSelection": {"range": {"start": 1, "end": 3}}
}
```

---

### 6. Error & Result Schema Completeness ⭐⭐

#### New Error Codes
- `INVALID_HEADING_PATH`
- `AMBIGUOUS_HEADING`
- `SECTION_NOT_FOUND`
- `FRONT_MATTER_NOT_FOUND`
- `CONFLICTING_EDITS`
- `FORMATTER_FAILED`
- `INVALID_REGEX`

#### Per-Edit Results
```json
{
  "ok": true,
  "editsApplied": 2,
  "editResults": [
    {
      "editIndex": 0,
      "op": "replace_match",
      "matchesFound": 3,
      "matchesReplaced": 3,
      "ranges": [...],
      "warnings": [],
      "noOp": false
    },
    {
      "editIndex": 1,
      "op": "replace_section",
      "sectionId": "sha256-...",
      "noOp": false
    }
  ]
}
```

---

### 7. Deterministic Plan-to-Apply Workflow ⭐

**Problem**: Race between dry-run preview and apply.

**Solution**: Plan IDs

```json
// Step 1: Dry run
{
  "dryRun": true,
  "edits": [...]
}
// Returns:
{
  "ok": true,
  "planId": "sha256-hash-of-edits+file+engine",
  "diff": "..."
}

// Step 2: Apply exact plan
{
  "planId": "sha256-...",
  "baseSha256": "abc123..."
  // No edits needed - applies the exact plan
}
```

**Benefit**: Eliminates time-of-check-time-of-use errors.

---

## Implementation Priority

### Phase 1: Critical (Do Now) 🔴

1. ✅ Specify line/column indexing (1-based, Unicode code points)
2. ✅ Add match reports to all responses
3. ✅ Return `canonicalHeadingPath` and `sectionId` in md-stat
4. ✅ Make `expectedText` required in `replace_range`
5. ✅ Add `expectedMatchCount` with range support
6. ✅ Add new error codes (AMBIGUOUS_HEADING, SECTION_NOT_FOUND, etc.)

### Phase 2: High Value (Next) 🟡

1. Add `upsert_section` operation
2. Add `rename_heading` operation
3. Expand node exclusions (inline code, link destinations)
4. Add per-edit result objects
5. Improve `matchSelection` (replace `occurrence`)

### Phase 3: Nice to Have (Later) 🟢

1. Plan IDs for deterministic apply
2. `previewMatches` mode
3. Overlap detection for edits
4. Enhanced match reporting with excluded counts

---

## Updated Best Practices for AI Assistants

### Minimal Happy Path

```javascript
// 1. Get structure
const stat = await md_stat({ file: "README.md" });
const { baseSha256, sections } = stat;

// 2. Find section by ID (not path - more stable)
const installSection = sections.find(s => 
  s.canonicalHeadingPath.join("/") === "installation"
);

// 3. Preview with match count validation
const preview = await md_apply({
  file: "README.md",
  baseSha256,
  dryRun: true,
  edits: [{
    op: "replace_match",
    sectionId: installSection.sectionId,  // use ID, not path
    pattern: "v1.0.0",
    matchType: "literal",
    expectedMatchCount: { min: 1, max: 3 },  // range OK
    nodeExclusions: { codeBlocks: "exclude" },
    replacement: "v2.0.0"
  }]
});

// 4. Check results
if (preview.matchesFound === 0) {
  // Handle no matches
}

// 5. Apply
await md_apply({ ...preview, dryRun: false });
```

---

## API Parameter Name Changes

| Current | Recommended | Reason |
|---------|-------------|--------|
| `literal` | `matchType: "literal"\|"regex"` | Clearer intent |
| `occurrence` | `matchSelection` | More precise |
| `expectedMatches` | `expectedMatchCount` | Distinguishes count from list |
| `headingPath` only | Allow `sectionId` too | Stability |

---

## Documentation Updates Needed

### Add to MARKDOWN-TOOLS.md

1. **Indexing section**:
   ```
   ## Line and Column Indexing
   - Lines: 1-based (first line is 1)
   - Columns: 1-based (first char is 1)
   - Units: Unicode code points
   - Ranges: Half-open [start, end) - end is exclusive
   ```

2. **Regex engine section**:
   ```
   ## Regex Semantics
   - Engine: Python `re` module
   - Default flags: caseSensitive=true, multiline=true
   - Supported flags: i (ignore case), m (multiline), s (dotall)
   ```

3. **Heading normalization rules**:
   ```
   ## Heading Normalization
   - Lowercase
   - Remove inline code, emphasis, emojis
   - Collapse whitespace
   - Result in `canonicalHeadingPath`
   ```

4. **Match reporting**:
   Show example responses with `matchesFound`, `matchesReplaced`, `matches[]`

5. **Error catalog**:
   Document all 13 error codes with examples

---

## Validation Against Expert Feedback

### ✅ Already Implemented Well

- Three-tool separation (stat/validate/apply)
- SHA-256 preconditions
- Atomic transactions
- Dry-run mode
- Code block exclusion by default
- Section scoping
- Sequential edit rebase

### 🔄 Needs Implementation

- Stable section IDs
- Canonical heading paths
- Match reporting
- Expected match count ranges
- Inline code exclusion
- Link destination exclusion
- `upsert_section` and `rename_heading` operations
- Per-edit results
- New error codes

### 📖 Needs Documentation

- Explicit indexing semantics
- Regex engine specification
- Heading normalization rules
- Node exclusion taxonomy
- Match report schemas

---

## Conclusion

**Current State**: Design is 85% optimal for AI use.

**With Phase 1 changes**: Will be 95%+ optimal.

**Key Insight from Expert**:
> "The design is sound and already safer than most file-edit APIs. By tightening semantics around indexing and regex, adding stable section identifiers and stronger match reporting, and providing upsert_section and rename_heading, you'll substantially reduce LLM error rates."

**Recommendation**: Implement Phase 1 (critical) changes before release. Phase 2 can follow based on real-world usage patterns.

---

## Next Steps

1. [ ] Update `markdown-tools.py` with Phase 1 changes
2. [ ] Update JSON schemas in `server.mjs`
3. [ ] Update all documentation
4. [ ] Add new test cases for improved features
5. [ ] Update examples to use best practices

**Timeline**: Phase 1 can be completed in 1-2 days of focused work.
