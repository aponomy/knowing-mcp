# CSV Tools Documentation

## `append-csv-row`

Append a single row to a CSV file. This tool is designed for incrementally building CSV datasets from browser automation or other data collection workflows.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes | Absolute path to the CSV file (e.g., `/Users/username/project/data/results.csv`) |
| `row` | array | Yes | Array of values to append as a new row. Values can be strings, numbers, or null. |

### Features

- ✅ **Auto-creates file and directories** - No need to pre-create the file structure
- ✅ **Proper CSV escaping** - Handles commas, quotes, newlines automatically
- ✅ **Type flexible** - Accepts strings, numbers, or null values
- ✅ **Incremental workflow** - Perfect for browser automation loops
- ✅ **No approval needed** - Direct file append operation

### Usage Examples

#### Basic Citation Collection

```javascript
// After extracting a citation from a webpage
mcp_append_csv_row({
  filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/results.csv",
  row: ["vad är diabetes", "Google AI Overview", 1, "https://www.1177.se/diabetes", "www.1177.se", "2025-10-26"]
})
```

#### Building a Dataset with Header

```javascript
// 1. Create CSV with header row
mcp_append_csv_row({
  filePath: "/Users/username/project/data/results.csv",
  row: ["query", "source_type", "position", "url", "domain", "date"]
})

// 2. Loop through browser results and append each citation
for (const citation of citations) {
  mcp_append_csv_row({
    filePath: "/Users/username/project/data/results.csv",
    row: [
      citation.query,
      citation.sourceType,
      citation.position,
      citation.url,
      citation.domain,
      new Date().toISOString().split('T')[0]
    ]
  })
}
```

#### Handling Special Characters

The tool automatically handles CSV escaping:

```javascript
// Values with commas, quotes, and newlines are properly escaped
mcp_append_csv_row({
  filePath: "/path/to/data.csv",
  row: [
    "Query with, comma",           // → "Query with, comma"
    'Text with "quotes"',           // → "Text with ""quotes"""
    null,                           // → (empty field)
    123,                            // → 123
    "Multi\nline\ntext"            // → "Multi\nline\ntext"
  ]
})
```

### Workflow Integration

#### Browser Automation Example

```javascript
// 1. Navigate to search results
await mcp_browser_navigate({ 
  url: "https://www.google.com/search?q=diabetes" 
})

// 2. Extract citations
const citations = await mcp_browser_evaluate({
  script: `
    Array.from(document.querySelectorAll('.g')).slice(0, 10).map((el, idx) => ({
      position: idx + 1,
      url: el.querySelector('a')?.href,
      domain: new URL(el.querySelector('a')?.href).hostname
    }))
  `
})

// 3. Append each citation to CSV
for (const citation of citations) {
  await mcp_append_csv_row({
    filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/diabetes.csv",
    row: [
      "diabetes",
      "Google Search",
      citation.position,
      citation.url,
      citation.domain,
      new Date().toISOString().split('T')[0]
    ]
  })
}
```

### Output

The tool provides feedback on the operation:

```
✅ Appended row to: /path/to/results.csv
Columns: 6
Data: vad är diabetes, Google AI Overview, 1, https://www.1177.se/diabetes, www.1177.se, 2025-10-26
```

For new files:

```
✅ Created CSV file and appended row to: /path/to/results.csv
Columns: 6
Data: query, source_type, position, url, domain, date
```

### CSV Format Details

- **Delimiter**: Comma (`,`)
- **Text Qualifier**: Double quote (`"`) when needed
- **Escape Sequence**: Double double-quote (`""`) for literal quotes
- **Line Ending**: Unix-style (`\n`)
- **Null Values**: Empty field (no quotes)

### Error Handling

The tool will fail with clear error messages if:
- `filePath` is not provided
- `row` is not an array
- Directory cannot be created
- File cannot be written (permissions, disk space, etc.)

### Best Practices

1. **Always start with a header row** for data clarity
2. **Use consistent column order** across all rows
3. **Use absolute paths** to avoid ambiguity
4. **Validate data** before appending (e.g., check URL validity)
5. **Add timestamps** to track when data was collected
6. **Handle errors gracefully** in loops to avoid stopping on one failure

### Comparison with Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| `append-csv-row` | ✅ Simple, direct, no approval | ❌ No validation, manual formatting |
| Manual file editing | ✅ Full control | ❌ Requires approval, error-prone |
| External scripts | ✅ Complex logic | ❌ Extra dependencies, setup needed |

### Testing

Run the included test to verify functionality:

```bash
node test/test-csv.mjs
```

This will create a sample CSV with various test cases including:
- Basic string/number values
- Values with commas and quotes
- Null values
- Multiple rows

### Limitations

- No built-in data validation (e.g., URL format checking)
- No duplicate detection
- No automatic type conversion (dates, numbers, etc.)
- UTF-8 encoding only
- No compression support

For advanced CSV operations (validation, transformation, analysis), consider using the `ask-expert` tool to generate custom scripts.
