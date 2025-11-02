#!/usr/bin/env node

/**
 * Test PDF Reading Tool
 * 
 * This script tests the read-pdf tool functionality.
 * 
 * Usage:
 *   node test/test-pdf.mjs [path-to-pdf]
 * 
 * If no path is provided, it will create a sample text file as a placeholder.
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createSamplePdf() {
  log('\n⚠️  No PDF file provided. Creating a sample text file as placeholder...', 'yellow');
  
  const samplePath = join(__dirname, 'test-data', 'sample-document.txt');
  const sampleContent = `Sample Document
================

This is a sample text file used for testing the PDF reader.

In a real scenario, this would be a PDF file with the following content:

Page 1
------
Introduction to the document.
This section contains important information.

Page 2
------
Main content and analysis.
Additional details and data.

Page 3
------
Conclusion and summary.
Final remarks and recommendations.

Metadata:
- Title: Sample Test Document
- Author: Test Suite
- Created: 2024-10-31
`;

  writeFileSync(samplePath, sampleContent, 'utf8');
  log(`✅ Created sample file: ${samplePath}`, 'green');
  log('\n💡 To test with a real PDF, run:', 'cyan');
  log('   node test/test-pdf.mjs /path/to/your/file.pdf', 'cyan');
  
  return samplePath;
}

async function testPdfReader(pdfPath) {
  log('\n📄 Testing PDF Reader Tool', 'blue');
  log('='.repeat(50), 'blue');
  
  try {
    // Check if file exists
    if (!existsSync(pdfPath)) {
      log(`\n❌ File not found: ${pdfPath}`, 'red');
      return false;
    }
    
    // Get script path
    const scriptPath = join(__dirname, '..', 'scripts', 'read-pdf.py');
    
    if (!existsSync(scriptPath)) {
      log(`\n❌ PDF reader script not found: ${scriptPath}`, 'red');
      return false;
    }
    
    // Check if it's actually a PDF
    const isPdf = pdfPath.toLowerCase().endsWith('.pdf');
    
    if (!isPdf) {
      log(`\n⚠️  Warning: File does not have .pdf extension`, 'yellow');
      log(`   File: ${pdfPath}`, 'yellow');
      log(`\n   This test will likely fail. Please provide a PDF file.`, 'yellow');
    }
    
    log(`\n📍 File: ${pdfPath}`, 'cyan');
    log(`📍 Script: ${scriptPath}`, 'cyan');
    
    // Test 1: Read as Markdown
    log('\n\n1️⃣  Test: Reading as Markdown', 'blue');
    log('-'.repeat(50), 'blue');
    
    try {
      const markdownOutput = execSync(
        `python3 "${scriptPath}" "${pdfPath}" --format markdown --json`,
        { 
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        }
      );
      
      const markdownResult = JSON.parse(markdownOutput);
      
      if (markdownResult.success) {
        log('✅ Markdown format: SUCCESS', 'green');
        log(`   Pages: ${markdownResult.page_count}`, 'cyan');
        if (markdownResult.metadata?.title) {
          log(`   Title: ${markdownResult.metadata.title}`, 'cyan');
        }
        if (markdownResult.metadata?.author) {
          log(`   Author: ${markdownResult.metadata.author}`, 'cyan');
        }
        log(`   Markdown length: ${markdownResult.markdown?.length || 0} chars`, 'cyan');
        
        // Show preview
        const preview = markdownResult.markdown?.substring(0, 200) || '';
        log(`\n   Preview:`, 'cyan');
        log(`   ${preview}...`, 'reset');
      } else {
        log(`❌ Markdown format: FAILED`, 'red');
        log(`   Error: ${markdownResult.error}`, 'red');
        return false;
      }
    } catch (error) {
      log(`❌ Markdown format: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      
      // Check for pypdf dependency
      if (error.message.includes('pypdf') || error.stderr?.includes('pypdf')) {
        log('\n💡 Tip: Install pypdf library:', 'yellow');
        log('   pip install pypdf', 'yellow');
      }
      
      return false;
    }
    
    // Test 2: Read as Text
    log('\n\n2️⃣  Test: Reading as Plain Text', 'blue');
    log('-'.repeat(50), 'blue');
    
    try {
      const textOutput = execSync(
        `python3 "${scriptPath}" "${pdfPath}" --format text --json`,
        { 
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        }
      );
      
      const textResult = JSON.parse(textOutput);
      
      if (textResult.success) {
        log('✅ Text format: SUCCESS', 'green');
        log(`   Pages: ${textResult.page_count}`, 'cyan');
        log(`   Text length: ${textResult.text?.length || 0} chars`, 'cyan');
        
        // Show preview
        const preview = textResult.text?.substring(0, 200) || '';
        log(`\n   Preview:`, 'cyan');
        log(`   ${preview}...`, 'reset');
      } else {
        log(`❌ Text format: FAILED`, 'red');
        log(`   Error: ${textResult.error}`, 'red');
        return false;
      }
    } catch (error) {
      log(`❌ Text format: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      return false;
    }
    
    log('\n\n' + '='.repeat(50), 'green');
    log('✅ All tests passed!', 'green');
    log('='.repeat(50) + '\n', 'green');
    
    return true;
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'blue');
  
  // Check Python
  try {
    const pythonVersion = execSync('python3 --version', { encoding: 'utf8' });
    log(`✅ Python: ${pythonVersion.trim()}`, 'green');
  } catch (error) {
    log('❌ Python 3 not found', 'red');
    log('   Install Python 3 to use the PDF reader', 'yellow');
    return false;
  }
  
  // Check pypdf
  try {
    execSync('python3 -c "import pypdf"', { encoding: 'utf8' });
    log('✅ pypdf library: installed', 'green');
  } catch (error) {
    log('❌ pypdf library: not installed', 'red');
    log('   Install with: pip install pypdf', 'yellow');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  log('\n📄 PDF Reader Test Suite', 'blue');
  log('='.repeat(50), 'blue');
  
  // Check dependencies first
  const depsOk = await checkDependencies();
  
  if (!depsOk) {
    log('\n❌ Missing dependencies. Please install them first.\n', 'red');
    process.exit(1);
  }
  
  // Get PDF path from command line or use sample
  const pdfPath = process.argv[2] || createSamplePdf();
  
  // Run tests
  const success = await testPdfReader(pdfPath);
  
  if (success) {
    log('✨ PDF reader is working correctly!\n', 'green');
    process.exit(0);
  } else {
    log('❌ PDF reader tests failed\n', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}\n`, 'red');
  process.exit(1);
});
