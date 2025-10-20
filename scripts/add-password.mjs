#!/usr/bin/env node

/**
 * Add Password to Chrome Profile
 * Manually adds a password entry to the Chrome/Chromium password store
 */

import { homedir } from 'os';
import { join } from 'path';
import readline from 'readline';

const PREFS_FILE = join(homedir(), '.mcp-chrome', 'Default', 'Preferences');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Chrome Password Manager - Manual Password Entry\n');
  console.log('⚠️  WARNING: This is a workaround for Playwright\'s automation limitations');
  console.log('Password saving is disabled in automation mode.\n');
  
  console.log('📝 RECOMMENDED APPROACH:');
  console.log('1. Use the browser window that\'s open');
  console.log('2. Navigate to chrome://password-manager/passwords');
  console.log('3. Use the browser\'s UI to manage passwords\n');
  
  console.log('Unfortunately, programmatically adding passwords requires:');
  console.log('- Access to Chrome\'s encryption keys (OS-specific)');
  console.log('- Modifying SQLite databases with proper encryption');
  console.log('- This is complex and security-sensitive\n');
  
  console.log('💡 ALTERNATIVE SOLUTIONS:\n');
  console.log('1. **Import from CSV** (Easiest):');
  console.log('   - Export passwords from your current password manager as CSV');
  console.log('   - Open chrome://password-manager/settings in the MCP browser');
  console.log('   - Click "Import passwords"');
  console.log('   - Select your CSV file\n');
  
  console.log('2. **Use a different approach**:');
  console.log('   - For automation, consider passing credentials as environment variables');
  console.log('   - Use the browser tools to fill forms programmatically');
  console.log('   - Store credentials in a secure vault and inject them via automation\n');
  
  console.log('3. **Enable password saving** (if possible):');
  console.log('   - This requires modifying Playwright to not use automation flags');
  console.log('   - May break other automation features\n');
  
  rl.close();
}

main().catch(console.error);
