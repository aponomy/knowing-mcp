#!/usr/bin/env node

/**
 * Test script for Playwright browser automation
 * Tests basic browser functionality without MCP server
 */

import { getBrowserManager } from '../src/browser-manager.mjs';

async function testBrowserAutomation() {
  console.log('🧪 Testing Playwright Browser Automation\n');
  
  const browserManager = getBrowserManager();
  
  try {
    // Test 1: Launch browser
    console.log('Test 1: Launching browser...');
    await browserManager.getBrowser();
    console.log('✅ Browser launched successfully\n');
    
    // Test 2: Navigate to a page
    console.log('Test 2: Navigating to example.com...');
    const page = await browserManager.getPage();
    await page.goto('https://example.com', { waitUntil: 'load' });
    console.log('✅ Navigation successful\n');
    
    // Test 3: Get page title
    console.log('Test 3: Getting page title...');
    const title = await page.title();
    console.log(`✅ Page title: "${title}"\n`);
    
    // Test 4: Get visible text
    console.log('Test 4: Getting page text...');
    const text = await page.locator('h1').textContent();
    console.log(`✅ Page heading: "${text}"\n`);
    
    // Test 5: Get current URL
    console.log('Test 5: Getting current URL...');
    const url = page.url();
    console.log(`✅ Current URL: ${url}\n`);
    
    // Test 6: Execute JavaScript
    console.log('Test 6: Executing JavaScript...');
    const result = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    console.log(`✅ Window size: ${result.windowSize.width}x${result.windowSize.height}\n`);
    
    console.log('🎉 All tests passed!\n');
    console.log('💡 The browser window should still be open.');
    console.log('💡 You can now manually interact with it or press Ctrl+C to close.\n');
    
    // Keep the browser open for manual testing
    console.log('⏳ Waiting 30 seconds before auto-closing...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
    console.log('✅ Browser closed\n');
    
    console.log('📁 Browser profile saved at:', process.env.BROWSER_USER_DATA_DIR || '~/.mcp-chrome');
    console.log('💾 Any manual logins or cookies have been preserved!\n');
  }
}

testBrowserAutomation().catch(console.error);
