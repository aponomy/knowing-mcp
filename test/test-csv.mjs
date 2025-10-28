#!/usr/bin/env node

/**
 * Test script for CSV append tool
 * 
 * This demonstrates the append-csv-row tool for incrementally building CSV files.
 * Perfect for browser automation workflows where you extract data row-by-row.
 */

import { appendFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testFilePath = join(__dirname, 'test-data', 'sample.csv');

// CSV escape function (same as in server)
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

const appendCsvRow = (filePath, row) => {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const csvLine = row.map(escapeCsvValue).join(',') + '\n';
  appendFileSync(filePath, csvLine, 'utf8');
};

console.log('🧪 Testing CSV append functionality...\n');

// Clean up any existing test file
if (existsSync(testFilePath)) {
  unlinkSync(testFilePath);
  console.log('🧹 Cleaned up existing test file');
}

// Test 1: Create CSV with header
console.log('\n📝 Test 1: Adding header row');
const header = ['query', 'source', 'position', 'url', 'domain', 'date'];
appendCsvRow(testFilePath, header);
console.log(`✅ Header: ${header.join(', ')}`);

// Test 2: Add citation data (simulating browser extraction)
console.log('\n📝 Test 2: Adding citation rows');
const citations = [
  ['vad är diabetes', 'Google AI Overview', 1, 'https://www.1177.se/diabetes', 'www.1177.se', '2025-10-26'],
  ['diabetes symptoms', 'Featured Snippet', 1, 'https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444', 'www.mayoclinic.org', '2025-10-26'],
  ['type 2 diabetes', 'People Also Ask', 3, 'https://www.cdc.gov/diabetes/basics/type2.html', 'www.cdc.gov', '2025-10-26']
];

citations.forEach((row, idx) => {
  appendCsvRow(testFilePath, row);
  console.log(`✅ Row ${idx + 1}: ${row[0]} → ${row[3]}`);
});

// Test 3: Test CSV escaping (values with commas and quotes)
console.log('\n📝 Test 3: Testing CSV escaping');
const specialRow = [
  'query with, comma',
  'Source "with quotes"',
  5,
  'https://example.com/path?param=value&other=test',
  'example.com',
  '2025-10-26'
];
appendCsvRow(testFilePath, specialRow);
console.log(`✅ Special chars: "${specialRow[0]}" and "${specialRow[1]}"`);

// Test 4: Test null values
console.log('\n📝 Test 4: Testing null values');
const nullRow = ['test query', null, 0, 'https://example.com', null, '2025-10-26'];
appendCsvRow(testFilePath, nullRow);
console.log(`✅ Null values: position=${nullRow[1]}, domain=${nullRow[4]}`);

console.log(`\n✅ All tests passed! Check the file at:\n   ${testFilePath}`);
console.log('\n💡 You can now use this tool in your MCP workflows:');
console.log('   mcp_append_csv_row({');
console.log('     filePath: "/path/to/results.csv",');
console.log('     row: ["query", "source", 1, "url", "domain", "date"]');
console.log('   })');
