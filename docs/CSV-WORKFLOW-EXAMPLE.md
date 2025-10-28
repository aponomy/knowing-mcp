# Citation Analysis Workflow Example

This example demonstrates how to use browser automation with CSV data collection to analyze search engine citations.

## Goal

Extract citation data from Google Search results and save to CSV for analysis.

## Workflow Steps

### 1. Set up your CSV file with headers

```javascript
mcp_append_csv_row({
  filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/life-science/results.csv",
  row: ["query", "source_type", "position", "url", "domain", "date_collected"]
})
```

### 2. Navigate to Google Search

```javascript
mcp_browser_navigate({
  url: "https://www.google.com/search?q=vad+är+diabetes"
})
```

### 3. Extract citations from the page

```javascript
const citations = await mcp_browser_evaluate({
  script: `
    // Extract AI Overview citations
    const aiOverview = document.querySelector('[data-attrid="AIOverview"]');
    const aiCitations = [];
    
    if (aiOverview) {
      const links = aiOverview.querySelectorAll('a[href^="http"]');
      links.forEach((link, idx) => {
        aiCitations.push({
          type: 'Google AI Overview',
          position: idx + 1,
          url: link.href,
          domain: new URL(link.href).hostname
        });
      });
    }
    
    // Extract organic search results
    const organicResults = [];
    document.querySelectorAll('.g').forEach((result, idx) => {
      const link = result.querySelector('a');
      if (link && link.href) {
        organicResults.push({
          type: 'Organic Result',
          position: idx + 1,
          url: link.href,
          domain: new URL(link.href).hostname
        });
      }
    });
    
    // Return combined results
    { aiCitations, organicResults }
  `
})
```

### 4. Save each citation to CSV

```javascript
// Save AI Overview citations
for (const citation of citations.aiCitations) {
  await mcp_append_csv_row({
    filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/life-science/results.csv",
    row: [
      "vad är diabetes",
      citation.type,
      citation.position,
      citation.url,
      citation.domain,
      new Date().toISOString().split('T')[0]
    ]
  })
}

// Save organic results
for (const result of citations.organicResults) {
  await mcp_append_csv_row({
    filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/life-science/results.csv",
    row: [
      "vad är diabetes",
      result.type,
      result.position,
      result.url,
      result.domain,
      new Date().toISOString().split('T')[0]
    ]
  })
}
```

## Complete Automated Script

Here's how you can automate this for multiple queries:

```javascript
// Define your search queries
const queries = [
  "vad är diabetes",
  "diabetes symptom",
  "typ 2 diabetes",
  "diabetes behandling",
  "diabetes mat"
];

// Create CSV with headers
await mcp_append_csv_row({
  filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/life-science/results.csv",
  row: ["query", "source_type", "position", "url", "domain", "date_collected"]
});

// Process each query
for (const query of queries) {
  console.log(`Processing: ${query}`);
  
  // Navigate to search results
  await mcp_browser_navigate({
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
  });
  
  // Wait for results to load
  await mcp_browser_wait_for({
    selector: '#search',
    timeout: 5000
  });
  
  // Extract citations
  const citations = await mcp_browser_evaluate({
    script: `
      const results = [];
      
      // AI Overview citations
      const aiOverview = document.querySelector('[data-attrid="AIOverview"]');
      if (aiOverview) {
        const links = aiOverview.querySelectorAll('a[href^="http"]');
        links.forEach((link, idx) => {
          results.push({
            type: 'Google AI Overview',
            position: idx + 1,
            url: link.href,
            domain: new URL(link.href).hostname
          });
        });
      }
      
      // Featured Snippet
      const featuredSnippet = document.querySelector('.xpdopen');
      if (featuredSnippet) {
        const link = featuredSnippet.querySelector('a[href^="http"]');
        if (link) {
          results.push({
            type: 'Featured Snippet',
            position: 1,
            url: link.href,
            domain: new URL(link.href).hostname
          });
        }
      }
      
      // Organic results (first 10)
      document.querySelectorAll('.g').forEach((result, idx) => {
        const link = result.querySelector('a');
        if (link && link.href && idx < 10) {
          results.push({
            type: 'Organic Result',
            position: idx + 1,
            url: link.href,
            domain: new URL(link.href).hostname
          });
        }
      });
      
      results
    `
  });
  
  // Save all citations to CSV
  for (const citation of citations) {
    await mcp_append_csv_row({
      filePath: "/Users/klas.ehnemark/Github/citation-analysis/data/life-science/results.csv",
      row: [
        query,
        citation.type,
        citation.position,
        citation.url,
        citation.domain,
        new Date().toISOString().split('T')[0]
      ]
    });
  }
  
  console.log(`✅ Saved ${citations.length} citations for: ${query}`);
  
  // Be nice to Google - wait between queries
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('✅ Citation analysis complete!');
```

## Expected CSV Output

```csv
query,source_type,position,url,domain,date_collected
vad är diabetes,Google AI Overview,1,https://www.1177.se/diabetes,www.1177.se,2025-10-26
vad är diabetes,Google AI Overview,2,https://www.livsmedelsverket.se/diabetes,www.livsmedelsverket.se,2025-10-26
vad är diabetes,Organic Result,1,https://www.1177.se/diabetes,www.1177.se,2025-10-26
vad är diabetes,Organic Result,2,https://www.mayoclinic.org/diseases-conditions/diabetes,www.mayoclinic.org,2025-10-26
diabetes symptom,Featured Snippet,1,https://www.cdc.gov/diabetes/symptoms,www.cdc.gov,2025-10-26
diabetes symptom,Organic Result,1,https://www.diabetes.org/symptoms,www.diabetes.org,2025-10-26
```

## Analysis Examples

Once you have the CSV data, you can analyze it:

### Python Analysis

```python
import pandas as pd
from collections import Counter

# Load data
df = pd.read_csv('results.csv')

# Top cited domains
top_domains = df['domain'].value_counts().head(10)
print("Top 10 cited domains:")
print(top_domains)

# Citation types distribution
citation_types = df['source_type'].value_counts()
print("\nCitation type distribution:")
print(citation_types)

# AI Overview vs Organic citations
ai_citations = df[df['source_type'] == 'Google AI Overview']
print(f"\nTotal AI Overview citations: {len(ai_citations)}")
print(f"Unique domains in AI Overview: {ai_citations['domain'].nunique()}")

# Most cited in AI Overview
if len(ai_citations) > 0:
    print("\nMost cited in AI Overview:")
    print(ai_citations['domain'].value_counts().head(5))
```

### Excel/Google Sheets Analysis

1. Import the CSV file
2. Create pivot tables:
   - Rows: domain
   - Values: Count of url
   - Filter: source_type
3. Create charts showing:
   - Domain citation frequency
   - Source type distribution
   - Citation position analysis

## Best Practices

1. **Rate limiting**: Add delays between requests to avoid being blocked
2. **Error handling**: Wrap in try-catch to handle missing elements
3. **Data validation**: Verify URLs are valid before saving
4. **Timestamps**: Always include collection date for tracking
5. **Consistent headers**: Use the same column order for all rows
6. **Backup data**: Save CSV files regularly or use version control

## Troubleshooting

### Issue: CSS selectors not working

Google frequently changes their HTML structure. Use `browser-get-content` to inspect:

```javascript
const html = await mcp_browser_get_content();
// Inspect the HTML structure and update selectors
```

### Issue: Too many citations extracted

Limit the results in your script:

```javascript
document.querySelectorAll('.g').slice(0, 10).forEach((result, idx) => {
  // Only process first 10 results
})
```

### Issue: CSV encoding problems with special characters

The tool automatically handles UTF-8 encoding and CSV escaping. If you see issues, check:
- File is being read with UTF-8 encoding
- Special characters in URLs are properly escaped

## Next Steps

- Add more data points (title, description, snippet text)
- Track changes over time (run daily/weekly)
- Compare results across different search engines
- Analyze citation patterns by topic/category
- Build visualizations from the CSV data
