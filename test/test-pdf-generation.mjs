#!/usr/bin/env node

/**
 * Test script for make-pdf functionality
 */

import { spawn } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧪 Testing make-pdf tool...\n');

// Test 1: Create PDF from sample markdown
console.log('Test 1: Creating PDF from sample.md');
const sampleMdPath = join(rootDir, 'test', 'test-data', 'sample.md');
const outputPdfPath = join(rootDir, 'test', 'test-data', 'output-test.pdf');
const outputHtmlPath = join(rootDir, 'test', 'test-data', 'output-test.html');

// Clean up previous test outputs
if (existsSync(outputPdfPath)) {
  unlinkSync(outputPdfPath);
}
if (existsSync(outputHtmlPath)) {
  unlinkSync(outputHtmlPath);
}

const scriptPath = join(rootDir, 'scripts', 'make-pdf.py');
const pythonProcess = spawn('python3', [scriptPath, sampleMdPath, '--output', outputPdfPath]);

let stdout = '';
let stderr = '';

pythonProcess.stdout.on('data', (data) => {
  stdout += data.toString();
});

pythonProcess.stderr.on('data', (data) => {
  stderr += data.toString();
});

pythonProcess.on('close', (code) => {
  console.log('Exit code:', code);
  
  if (stderr) {
    console.log('Stderr:', stderr);
  }
  
  try {
    const result = JSON.parse(stdout);
    console.log('\nResult:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ PDF/HTML generation successful!');
      console.log(`   Output: ${result.pdfPath}`);
      console.log(`   Size: ${(result.pdfSize / 1024).toFixed(2)} KB`);
      console.log(`   Method: ${result.method}`);
      
      if (result.note) {
        console.log(`   Note: ${result.note}`);
      }
      
      // Check if file exists
      if (existsSync(result.pdfPath)) {
        console.log(`   ✓ File exists and is readable`);
      } else {
        console.log(`   ✗ File does not exist: ${result.pdfPath}`);
      }
    } else {
      console.log('\n❌ PDF generation failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (e) {
    console.log('\n❌ Failed to parse output');
    console.log('Output:', stdout);
    console.log('Error:', e.message);
  }
});
