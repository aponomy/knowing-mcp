#!/usr/bin/env node

/**
 * Test script for knowing-mcp server
 * Tests git repository detection and environment setup
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

console.log('🧪 Testing knowing-mcp configuration...\n');

// Test 1: Git repository detection
console.log('📍 Test 1: Git Repository Detection');
console.log('─────────────────────────────────────');

try {
  const cwd = process.cwd();
  console.log(`Current directory: ${cwd}`);
  
  // Check .git exists
  const gitDir = join(cwd, '.git');
  if (!existsSync(gitDir)) {
    console.log('❌ Not a git repository (no .git directory)');
    process.exit(1);
  }
  console.log('✅ Found .git directory');
  
  // Get remote URL
  const remoteUrl = execSync('git config --get remote.origin.url', {
    encoding: 'utf8'
  }).trim();
  console.log(`✅ Remote URL: ${remoteUrl}`);
  
  // Parse owner/repo
  let match;
  if (remoteUrl.startsWith('https://')) {
    match = remoteUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  } else if (remoteUrl.startsWith('git@')) {
    match = remoteUrl.match(/github\.com:([^\/]+)\/([^\/\.]+)/);
  }
  
  if (match) {
    const [, owner, repo] = match;
    console.log(`✅ Detected: ${owner}/${repo}\n`);
  } else {
    console.log('❌ Could not parse GitHub owner/repo from URL\n');
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 2: Environment variables
console.log('🔐 Test 2: Environment Variables');
console.log('─────────────────────────────────');

// Load global config
const globalConfigPath = join(process.env.HOME || process.env.USERPROFILE, '.knowing-mcp.env');
if (existsSync(globalConfigPath)) {
  dotenv.config({ path: globalConfigPath });
  console.log(`✅ Loaded global config: ${globalConfigPath}`);
} else {
  console.log(`ℹ️  No global config found at: ${globalConfigPath}`);
  console.log('   You can create one with your credentials');
}

const requiredVars = [
  'GH_TOKEN',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_KEY'
];

const optionalVars = [
  'AZURE_OPENAI_GPT5_DEPLOYMENT'
];

console.log('\nRequired environment variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${varName}: ${masked}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

console.log('\nOptional environment variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ℹ️  ${varName}: not set (will use default)`);
  }
});

// Test 3: Dependencies
console.log('\n📦 Test 3: Dependencies');
console.log('─────────────────────────────────');

// Find the knowing-mcp directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const knowingMcpDir = __dirname;

try {
  const packageJsonPath = join(knowingMcpDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  console.log(`Dependencies: ${deps.join(', ')}`);
  
  // Check if node_modules exists
  const nodeModulesPath = join(knowingMcpDir, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    console.log('✅ node_modules found');
  } else {
    console.log('❌ node_modules not found - run: npm install');
  }
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
}

// Test 4: Server executable
console.log('\n🚀 Test 4: Server Executable');
console.log('─────────────────────────────────');

const serverPath = join(knowingMcpDir, 'server.mjs');
if (existsSync(serverPath)) {
  console.log('✅ server.mjs found');
  console.log(`   Path: ${serverPath}`);
  
  // Check if it's executable
  try {
    const stats = readFileSync(serverPath, 'utf8');
    if (stats.startsWith('#!/usr/bin/env node')) {
      console.log('✅ Has shebang for direct execution');
    }
  } catch (error) {
    console.log(`⚠️  Could not check file: ${error.message}`);
  }
} else {
  console.log('❌ server.mjs not found');
}

// Summary
console.log('\n📊 Summary');
console.log('─────────────────────────────────');

const hasGit = existsSync(join(process.cwd(), '.git'));
const hasCredentials = process.env.GH_TOKEN && 
                        process.env.AZURE_OPENAI_ENDPOINT && 
                        process.env.AZURE_OPENAI_API_KEY;
const hasDeps = existsSync(join(knowingMcpDir, 'node_modules'));
const hasServer = existsSync(serverPath);

if (hasGit && hasCredentials && hasDeps && hasServer) {
  console.log('✅ All checks passed! Server is ready to use.');
  console.log('\nNext steps:');
  console.log('1. Add to VS Code User Settings (see README.md)');
  console.log('2. Reload VS Code window');
  console.log('3. Test in Copilot Chat: "List all open issues"');
} else {
  console.log('⚠️  Some checks failed. Please review above.');
  if (!hasGit) console.log('   - Not in a git repository');
  if (!hasCredentials) console.log('   - Missing credentials (see README.md for setup)');
  if (!hasDeps) console.log('   - Run: npm install in tools/knowing-mcp');
  if (!hasServer) console.log('   - Missing server.mjs');
}

console.log('');
