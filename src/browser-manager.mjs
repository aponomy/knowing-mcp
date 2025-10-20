import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { chromium } from 'playwright';

/**
 * Browser Manager - Handles persistent, headed Chrome browser sessions
 * Maintains browser instance across tool calls for efficient automation
 */
class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.userDataDir = process.env.BROWSER_USER_DATA_DIR || join(homedir(), '.mcp-chrome');
    this.extensionsDir = join(this.userDataDir, 'extensions');
    
    // Ensure directories exist
    if (!existsSync(this.userDataDir)) {
      mkdirSync(this.userDataDir, { recursive: true });
      console.error(`📁 Created browser profile directory: ${this.userDataDir}`);
    }
    if (!existsSync(this.extensionsDir)) {
      mkdirSync(this.extensionsDir, { recursive: true });
      console.error(`📁 Created extensions directory: ${this.extensionsDir}`);
    }
  }

  /**
   * Get paths to all extensions in the extensions directory
   */
  getExtensionPaths() {
    if (!existsSync(this.extensionsDir)) {
      return [];
    }
    
    try {
      const entries = readdirSync(this.extensionsDir);
      return entries
        .map(entry => join(this.extensionsDir, entry))
        .filter(path => {
          // Must be a directory with a manifest.json
          if (!statSync(path).isDirectory()) return false;
          const manifestPath = join(path, 'manifest.json');
          return existsSync(manifestPath);
        });
    } catch (error) {
      console.error('⚠️  Error reading extensions:', error.message);
      return [];
    }
  }

  /**
   * Get or create browser instance
   * Always uses headed mode with persistent context for manual logins
   */
  async getBrowser() {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    console.error('🚀 Launching Chrome browser in headed mode...');
    console.error(`📁 Profile: ${this.userDataDir}`);
    
    // Check for extensions
    const extensionPaths = this.getExtensionPaths();
    if (extensionPaths.length > 0) {
      console.error(`🧩 Loading ${extensionPaths.length} extension(s)...`);
      extensionPaths.forEach(path => {
        console.error(`   - ${path.split('/').pop()}`);
      });
    }
    
    try {
      // Build args with extensions if any
      const args = [
        '--disable-blink-features=AutomationControlled', // Avoid detection
        '--disable-dev-shm-usage',
      ];
      
      // Configuration for launching
      const launchOptions = {
        headless: false,  // ALWAYS visible
        viewport: { width: 1280, height: 720 },
        args,
        acceptDownloads: true,
      };
      
      // Add extension args if we have any
      // Note: Extensions require using Chromium (not Chrome channel)
      if (extensionPaths.length > 0) {
        args.push(`--disable-extensions-except=${extensionPaths.join(',')}`);
        args.push(`--load-extension=${extensionPaths.join(',')}`);
        console.error('📝 Using Chromium for extension support');
      } else {
        // Only use Chrome channel if no extensions (Chrome doesn't support loading extensions via args)
        launchOptions.channel = 'chrome';
        args.push('--no-sandbox'); // Only needed for Chrome channel
      }
      
      // Launch browser with persistent context
      this.context = await chromium.launchPersistentContext(this.userDataDir, launchOptions);

      this.browser = this.context.browser();

      // Get or create first page
      const pages = this.context.pages();
      if (pages.length > 0) {
        this.page = pages[0];
      } else {
        this.page = await this.context.newPage();
      }

      console.error('✅ Browser launched successfully');
      console.error('💡 You can now manually log into services - sessions will persist!');

      return this.browser;
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      throw new Error(`Browser launch failed: ${error.message}`);
    }
  }

  /**
   * Get or create the active page
   */
  async getPage() {
    await this.getBrowser(); // Ensure browser is running

    // Check if current page is still valid
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    // Get existing pages or create new one
    const pages = this.context.pages();
    if (pages.length > 0) {
      this.page = pages[pages.length - 1]; // Use most recent page
    } else {
      this.page = await this.context.newPage();
    }

    return this.page;
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    try {
      if (this.context) {
        await this.context.close();
        console.error('🔒 Browser closed');
      }
      this.browser = null;
      this.context = null;
      this.page = null;
    } catch (error) {
      console.error('⚠️  Error closing browser:', error.message);
    }
  }

  /**
   * Get browser status
   */
  isRunning() {
    return this.browser && this.browser.isConnected();
  }
}

// Singleton instance
let browserManager = null;

export function getBrowserManager() {
  if (!browserManager) {
    browserManager = new BrowserManager();
  }
  return browserManager;
}

export async function closeBrowser() {
  if (browserManager) {
    await browserManager.close();
    browserManager = null;
  }
}
