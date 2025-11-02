#!/usr/bin/env node

/**
 * Test script for Markdown tools
 * Tests md-stat, md-validate, and md-apply operations
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data directory
const testDataDir = join(__dirname, 'test-data');
if (!existsSync(testDataDir)) {
  mkdirSync(testDataDir, { recursive: true });
}

// Sample markdown file for testing
const sampleMarkdown = `---
title: Test Document
version: 1.0.0
tags:
  - test
  - markdown
---

# Test Document

This is a test document for markdown tools.

## Installation

Install using npm:

\`\`\`bash
npm install test-package
\`\`\`

Or use version 1.0.0 specifically.

## Usage

Basic usage example:

\`\`\`javascript
const pkg = require('test-package');
pkg.run();
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## API Reference

### Methods

| Method | Description |
|--------|-------------|
| run()  | Run the package |
| stop() | Stop the package |

## Changelog

### 1.0.0

Initial release.
`;

const testFile = join(testDataDir, 'test-markdown.md');

// Helper to run Python script
function runMarkdownTool(command, args) {
  const scriptPath = join(__dirname, '..', 'scripts', 'markdown-tools.py');
  const fullCommand = `python3 "${scriptPath}" ${command} ${args}`;
  
  console.log(`\n🔧 Running: ${command}`);
  
  try {
    const output = execSync(fullCommand, { encoding: 'utf8', shell: '/bin/bash' });
    const result = JSON.parse(output);
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (e) {
        console.error('Output:', error.stdout);
      }
    }
    throw error;
  }
}

// Test suite
async function runTests() {
  console.log('🧪 Testing Markdown Tools\n');
  console.log('='.repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Setup: Create test file
    console.log('\n📝 Setting up test file...');
    writeFileSync(testFile, sampleMarkdown);
    console.log(`✅ Created test file: ${testFile}`);
    
    // Test 1: md-stat
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: md-stat - Get file statistics');
    console.log('='.repeat(60));
    
    const statResult = runMarkdownTool('stat', `--file "${testFile}"`);
    
    if (statResult.ok) {
      console.log('✅ md-stat succeeded');
      console.log(`   - SHA-256: ${statResult.contentSha256}`);
      console.log(`   - Encoding: ${statResult.encoding}`);
      console.log(`   - Lines: ${statResult.lineCount}`);
      console.log(`   - Sections: ${statResult.sections.length}`);
      console.log(`   - Code Blocks: ${statResult.codeBlocks.length}`);
      console.log(`   - Tables: ${statResult.tables.length}`);
      console.log(`   - Front Matter: ${statResult.hasFrontMatter ? 'Yes' : 'No'}`);
      testsPassed++;
    } else {
      console.log('❌ md-stat failed:', statResult.error);
      testsFailed++;
    }
    
    const baseSha = statResult.contentSha256;
    
    // Test 2: md-validate
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: md-validate - Validate markdown');
    console.log('='.repeat(60));
    
    const validateResult = runMarkdownTool('validate', `--file "${testFile}"`);
    
    if (validateResult.ok) {
      console.log('✅ md-validate succeeded');
      console.log(`   - Diagnostics: ${validateResult.diagnostics.length}`);
      
      if (validateResult.diagnostics.length > 0) {
        for (const diag of validateResult.diagnostics) {
          console.log(`   - ${diag.severity}: ${diag.message}`);
        }
      } else {
        console.log('   - No issues found');
      }
      testsPassed++;
    } else {
      console.log('❌ md-validate failed:', validateResult.error);
      testsFailed++;
    }
    
    // Test 3: md-apply (dry-run) - Replace section
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: md-apply (dry-run) - Replace section');
    console.log('='.repeat(60));
    
    const edits1 = JSON.stringify([
      {
        op: 'replace_section',
        headingPath: ['Test Document', 'Installation'],
        markdown: '## Installation\\n\\nInstall using npm or yarn:\\n\\n```bash\\nnpm install test-package\\n# or\\nyarn add test-package\\n```\\n',
        keepSubsections: false
      }
    ]);
    
    const dryRunResult = runMarkdownTool(
      'apply',
      `--file "${testFile}" --base-sha256 "${baseSha}" --dry-run --edits '${edits1}'`
    );
    
    if (dryRunResult.ok) {
      console.log('✅ md-apply (dry-run) succeeded');
      console.log(`   - Edits applied: ${dryRunResult.editsApplied}`);
      console.log(`   - Dry run: ${dryRunResult.dryRun}`);
      console.log('   - Diff preview:');
      console.log(dryRunResult.diff.split('\n').slice(0, 20).join('\n'));
      testsPassed++;
    } else {
      console.log('❌ md-apply (dry-run) failed:', dryRunResult.error);
      testsFailed++;
    }
    
    // Test 4: md-apply (live) - Replace match
    console.log('\n' + '='.repeat(60));
    console.log('Test 4: md-apply (live) - Replace version number');
    console.log('='.repeat(60));
    
    const edits2 = JSON.stringify([
      {
        op: 'replace_match',
        pattern: '1.0.0',
        literal: true,
        occurrence: 'all',
        expectedMatches: 3,  // 3 occurrences: front matter, text, and heading
        codeBlocks: 'exclude',
        replacement: '2.0.0'
      }
    ]);
    
    const applyResult = runMarkdownTool(
      'apply',
      `--file "${testFile}" --base-sha256 "${baseSha}" --edits '${edits2}'`
    );
    
    if (applyResult.ok) {
      console.log('✅ md-apply (live) succeeded');
      console.log(`   - Edits applied: ${applyResult.editsApplied}`);
      console.log(`   - New SHA-256: ${applyResult.contentSha256}`);
      testsPassed++;
    } else {
      console.log('❌ md-apply (live) failed:', applyResult.error);
      testsFailed++;
    }
    
    // Test 5: md-apply - Update front matter
    console.log('\n' + '='.repeat(60));
    console.log('Test 5: md-apply - Update front matter');
    console.log('='.repeat(60));
    
    // Get new SHA after previous edit
    const statResult2 = runMarkdownTool('stat', `--file "${testFile}"`);
    const newSha = statResult2.contentSha256;
    
    const edits3 = JSON.stringify([
      {
        op: 'update_front_matter',
        set: {
          version: '2.0.0',
          updated: '2025-11-01'
        }
      }
    ]);
    
    const fmResult = runMarkdownTool(
      'apply',
      `--file "${testFile}" --base-sha256 "${newSha}" --edits '${edits3}'`
    );
    
    if (fmResult.ok) {
      console.log('✅ md-apply (front matter) succeeded');
      console.log(`   - Edits applied: ${fmResult.editsApplied}`);
      testsPassed++;
    } else {
      console.log('❌ md-apply (front matter) failed:', fmResult.error);
      testsFailed++;
    }
    
    // Test 6: md-apply - Insert after heading
    console.log('\n' + '='.repeat(60));
    console.log('Test 6: md-apply - Insert after heading');
    console.log('='.repeat(60));
    
    const statResult3 = runMarkdownTool('stat', `--file "${testFile}"`);
    const newSha2 = statResult3.contentSha256;
    
    const edits4 = JSON.stringify([
      {
        op: 'insert_after_heading',
        headingPath: ['Test Document', 'Features'],
        position: 'afterHeading',
        ensureBlankLine: true,
        markdown: '> **Note**: These features are experimental.\\n'
      }
    ]);
    
    const insertResult = runMarkdownTool(
      'apply',
      `--file "${testFile}" --base-sha256 "${newSha2}" --edits '${edits4}'`
    );
    
    if (insertResult.ok) {
      console.log('✅ md-apply (insert) succeeded');
      console.log(`   - Edits applied: ${insertResult.editsApplied}`);
      testsPassed++;
    } else {
      console.log('❌ md-apply (insert) failed:', insertResult.error);
      testsFailed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📊 Total: ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    if (existsSync(testFile)) {
      unlinkSync(testFile);
      console.log('✅ Removed test file');
    }
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
