#!/usr/bin/env node

/**
 * Install Chrome Extension Helper
 * Downloads and installs Chrome extensions for use with MCP browser
 */

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import http from 'http';
import https from 'https';
import { homedir } from 'os';
import { join } from 'path';

const EXTENSIONS_DIR = join(homedir(), '.mcp-chrome', 'extensions');

// Ensure extensions directory exists
if (!existsSync(EXTENSIONS_DIR)) {
  mkdirSync(EXTENSIONS_DIR, { recursive: true });
}

/**
 * Download a file from URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        file.close();
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

/**
 * Extract CRX file using unzip
 */
function extractCrx(crxPath, outputDir) {
  try {
    // CRX files are basically ZIP files with a header
    // We can use unzip to extract them
    execSync(`unzip -q "${crxPath}" -d "${outputDir}"`, { stdio: 'inherit' });
    console.log(`✅ Extracted to: ${outputDir}`);
  } catch (error) {
    throw new Error(`Failed to extract CRX: ${error.message}`);
  }
}

/**
 * Get extension ID from Chrome Web Store URL
 */
function getExtensionId(url) {
  const match = url.match(/\/detail\/[^/]+\/([a-z]{32})/);
  if (!match) {
    throw new Error('Invalid Chrome Web Store URL');
  }
  return match[1];
}

/**
 * Download and install extension from Chrome Web Store
 */
async function installExtension(webStoreUrl) {
  console.log('🔍 Parsing extension URL...');
  const extensionId = getExtensionId(webStoreUrl);
  console.log(`📦 Extension ID: ${extensionId}`);
  
  // Chrome Web Store download URL
  const downloadUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=49.0&acceptformat=crx3&x=id%3D${extensionId}%26installsource%3Dondemand%26uc`;
  
  const crxPath = join(EXTENSIONS_DIR, `${extensionId}.crx`);
  const extractDir = join(EXTENSIONS_DIR, extensionId);
  
  // Check if already installed
  if (existsSync(extractDir)) {
    console.log('⚠️  Extension already installed!');
    console.log(`📁 Location: ${extractDir}`);
    const answer = await promptUser('Reinstall? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Installation cancelled');
      return;
    }
    // Remove existing
    execSync(`rm -rf "${extractDir}"`);
  }
  
  console.log('⬇️  Downloading extension...');
  await downloadFile(downloadUrl, crxPath);
  console.log('✅ Downloaded!');
  
  console.log('📂 Extracting extension...');
  mkdirSync(extractDir, { recursive: true });
  extractCrx(crxPath, extractDir);
  
  // Clean up CRX file
  execSync(`rm "${crxPath}"`);
  
  console.log('');
  console.log('✅ Extension installed successfully!');
  console.log(`📁 Location: ${extractDir}`);
  console.log('');
  console.log('🔄 Restart your MCP server to load the extension.');
}

/**
 * List installed extensions
 */
function listExtensions() {
  if (!existsSync(EXTENSIONS_DIR)) {
    console.log('No extensions installed yet.');
    return;
  }
  
  const entries = readdirSync(EXTENSIONS_DIR);
  const extensions = entries.filter(entry => 
    statSync(join(EXTENSIONS_DIR, entry)).isDirectory()
  );
  
  if (extensions.length === 0) {
    console.log('No extensions installed yet.');
    return;
  }
  
  console.log(`\n📦 Installed Extensions (${extensions.length}):\n`);
  extensions.forEach((ext, index) => {
    const extPath = join(EXTENSIONS_DIR, ext);
    const manifestPath = join(extPath, 'manifest.json');
    
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        console.log(`${index + 1}. ${manifest.name} (v${manifest.version})`);
        console.log(`   ID: ${ext}`);
        console.log(`   Path: ${extPath}`);
      } catch (error) {
        console.log(`${index + 1}. ${ext} (invalid manifest)`);
      }
    } else {
      console.log(`${index + 1}. ${ext} (no manifest)`);
    }
    console.log('');
  });
}

/**
 * Prompt user for input
 */
function promptUser(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

/**
 * Show usage
 */
function showUsage() {
  console.log(`
Chrome Extension Installer for MCP Browser

Usage:
  node scripts/install-extension.mjs <chrome-web-store-url>
  node scripts/install-extension.mjs --list

Examples:
  # Install iCloud Passwords extension
  node scripts/install-extension.mjs https://chromewebstore.google.com/detail/icloud-passwords/pejdijmoenmkgeppbflobdenhhabjlaj
  
  # List installed extensions
  node scripts/install-extension.mjs --list

Extensions are installed to: ${EXTENSIONS_DIR}
  `);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  process.exit(0);
}

if (args[0] === '--list') {
  listExtensions();
} else if (args[0].startsWith('http')) {
  installExtension(args[0]).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
} else {
  showUsage();
  process.exit(1);
}
