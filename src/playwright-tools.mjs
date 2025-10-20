import { getBrowserManager } from './browser-manager.mjs';

/**
 * Playwright Browser Automation Tools for MCP
 * These tools enable browser automation with persistent, headed sessions
 */

export const PLAYWRIGHT_TOOLS = [
  {
    name: "browser-navigate",
    description: "Navigate to a URL in the browser. Browser will be launched if not already running.",
    inputSchema: {
      type: "object",
      properties: {
        url: { 
          type: "string", 
          description: "URL to navigate to (must include protocol: https:// or http://)"
        },
        waitUntil: {
          type: "string",
          enum: ["load", "domcontentloaded", "networkidle"],
          description: "When to consider navigation successful (default: load)"
        }
      },
      required: ["url"]
    }
  },
  {
    name: "browser-click",
    description: "Click an element on the page using a CSS selector.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the element to click"
        },
        timeout: {
          type: "number",
          description: "Maximum time to wait for element in milliseconds (default: 30000)"
        }
      },
      required: ["selector"]
    }
  },
  {
    name: "browser-type",
    description: "Type text into an input field.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the input element"
        },
        text: { 
          type: "string", 
          description: "Text to type"
        },
        clear: {
          type: "boolean",
          description: "Clear existing text before typing (default: true)"
        },
        delay: {
          type: "number",
          description: "Delay between key presses in milliseconds (default: 0)"
        }
      },
      required: ["selector", "text"]
    }
  },
  {
    name: "browser-screenshot",
    description: "Take a screenshot of the current page or a specific element.",
    inputSchema: {
      type: "object",
      properties: {
        path: { 
          type: "string", 
          description: "File path to save screenshot (optional, returns base64 if omitted)"
        },
        selector: {
          type: "string",
          description: "CSS selector to screenshot specific element (optional)"
        },
        fullPage: {
          type: "boolean",
          description: "Capture full scrollable page (default: false)"
        }
      },
      required: []
    }
  },
  {
    name: "browser-wait-for",
    description: "Wait for an element to appear on the page.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the element to wait for"
        },
        state: {
          type: "string",
          enum: ["attached", "detached", "visible", "hidden"],
          description: "State to wait for (default: visible)"
        },
        timeout: {
          type: "number",
          description: "Maximum time to wait in milliseconds (default: 30000)"
        }
      },
      required: ["selector"]
    }
  },
  {
    name: "browser-evaluate",
    description: "Execute JavaScript code in the browser page context.",
    inputSchema: {
      type: "object",
      properties: {
        script: { 
          type: "string", 
          description: "JavaScript code to execute"
        }
      },
      required: ["script"]
    }
  },
  {
    name: "browser-get-content",
    description: "Get the HTML content of the current page or a specific element.",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector to get content from (optional, gets full page if omitted)"
        }
      },
      required: []
    }
  },
  {
    name: "browser-get-text",
    description: "Get visible text content from the page or a specific element.",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector to get text from (optional, gets body text if omitted)"
        }
      },
      required: []
    }
  },
  {
    name: "browser-fill",
    description: "Fill a form field (more reliable than type for form inputs).",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the form field"
        },
        value: { 
          type: "string", 
          description: "Value to fill"
        }
      },
      required: ["selector", "value"]
    }
  },
  {
    name: "browser-select",
    description: "Select option(s) from a <select> element.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the select element"
        },
        value: { 
          type: "string", 
          description: "Value to select (can be value, label, or index)"
        }
      },
      required: ["selector", "value"]
    }
  },
  {
    name: "browser-press",
    description: "Press a key or key combination (e.g., Enter, Control+A).",
    inputSchema: {
      type: "object",
      properties: {
        key: { 
          type: "string", 
          description: "Key to press (e.g., 'Enter', 'Escape', 'Control+C')"
        },
        selector: {
          type: "string",
          description: "CSS selector to focus before pressing key (optional)"
        }
      },
      required: ["key"]
    }
  },
  {
    name: "browser-hover",
    description: "Hover over an element.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { 
          type: "string", 
          description: "CSS selector for the element to hover"
        }
      },
      required: ["selector"]
    }
  },
  {
    name: "browser-get-url",
    description: "Get the current page URL.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "browser-go-back",
    description: "Navigate back in browser history.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "browser-go-forward",
    description: "Navigate forward in browser history.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "browser-reload",
    description: "Reload the current page.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "browser-close",
    description: "Close the browser and cleanup. Sessions are preserved in the persistent profile.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

/**
 * Handle Playwright tool execution
 */
export async function handlePlaywrightTool(name, args) {
  const browserManager = getBrowserManager();

  try {
    switch (name) {
      case "browser-navigate": {
        const { url, waitUntil = "load" } = args;
        const page = await browserManager.getPage();
        await page.goto(url, { waitUntil, timeout: 60000 });
        const finalUrl = page.url();
        return {
          content: [
            {
              type: "text",
              text: `🌐 Navigated to: ${finalUrl}`
            }
          ]
        };
      }

      case "browser-click": {
        const { selector, timeout = 30000 } = args;
        const page = await browserManager.getPage();
        await page.click(selector, { timeout });
        return {
          content: [
            {
              type: "text",
              text: `✅ Clicked: ${selector}`
            }
          ]
        };
      }

      case "browser-type": {
        const { selector, text, clear = true, delay = 0 } = args;
        const page = await browserManager.getPage();
        
        if (clear) {
          await page.fill(selector, '');
        }
        
        await page.type(selector, text, { delay });
        return {
          content: [
            {
              type: "text",
              text: `⌨️  Typed into ${selector}: "${text}"`
            }
          ]
        };
      }

      case "browser-screenshot": {
        const { path, selector, fullPage = false } = args;
        const page = await browserManager.getPage();
        
        let screenshot;
        const options = { fullPage };
        
        if (selector) {
          const element = await page.locator(selector);
          screenshot = await element.screenshot(options);
        } else {
          if (path) {
            options.path = path;
          }
          screenshot = await page.screenshot(options);
        }
        
        if (path) {
          return {
            content: [
              {
                type: "text",
                text: `📸 Screenshot saved to: ${path}`
              }
            ]
          };
        } else {
          const base64 = screenshot.toString('base64');
          return {
            content: [
              {
                type: "text",
                text: `📸 Screenshot captured (${base64.length} bytes)`
              },
              {
                type: "image",
                data: base64,
                mimeType: "image/png"
              }
            ]
          };
        }
      }

      case "browser-wait-for": {
        const { selector, state = "visible", timeout = 30000 } = args;
        const page = await browserManager.getPage();
        await page.waitForSelector(selector, { state, timeout });
        return {
          content: [
            {
              type: "text",
              text: `⏳ Element ${state}: ${selector}`
            }
          ]
        };
      }

      case "browser-evaluate": {
        const { script } = args;
        const page = await browserManager.getPage();
        const result = await page.evaluate(script);
        return {
          content: [
            {
              type: "text",
              text: `🔧 Script executed\nResult: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }

      case "browser-get-content": {
        const { selector } = args;
        const page = await browserManager.getPage();
        
        let content;
        if (selector) {
          content = await page.locator(selector).innerHTML();
        } else {
          content = await page.content();
        }
        
        return {
          content: [
            {
              type: "text",
              text: `📄 HTML Content${selector ? ` (${selector})` : ''}:\n\n${content.substring(0, 5000)}${content.length > 5000 ? '\n\n... (truncated)' : ''}`
            }
          ]
        };
      }

      case "browser-get-text": {
        const { selector } = args;
        const page = await browserManager.getPage();
        
        let text;
        if (selector) {
          text = await page.locator(selector).textContent();
        } else {
          text = await page.locator('body').textContent();
        }
        
        return {
          content: [
            {
              type: "text",
              text: `📝 Text Content${selector ? ` (${selector})` : ''}:\n\n${text.trim()}`
            }
          ]
        };
      }

      case "browser-fill": {
        const { selector, value } = args;
        const page = await browserManager.getPage();
        await page.fill(selector, value);
        return {
          content: [
            {
              type: "text",
              text: `✍️  Filled ${selector}: "${value}"`
            }
          ]
        };
      }

      case "browser-select": {
        const { selector, value } = args;
        const page = await browserManager.getPage();
        await page.selectOption(selector, value);
        return {
          content: [
            {
              type: "text",
              text: `✅ Selected ${selector}: "${value}"`
            }
          ]
        };
      }

      case "browser-press": {
        const { key, selector } = args;
        const page = await browserManager.getPage();
        
        if (selector) {
          await page.press(selector, key);
        } else {
          await page.keyboard.press(key);
        }
        
        return {
          content: [
            {
              type: "text",
              text: `⌨️  Pressed: ${key}${selector ? ` on ${selector}` : ''}`
            }
          ]
        };
      }

      case "browser-hover": {
        const { selector } = args;
        const page = await browserManager.getPage();
        await page.hover(selector);
        return {
          content: [
            {
              type: "text",
              text: `👆 Hovered over: ${selector}`
            }
          ]
        };
      }

      case "browser-get-url": {
        const page = await browserManager.getPage();
        const url = page.url();
        return {
          content: [
            {
              type: "text",
              text: `🌐 Current URL: ${url}`
            }
          ]
        };
      }

      case "browser-go-back": {
        const page = await browserManager.getPage();
        await page.goBack();
        return {
          content: [
            {
              type: "text",
              text: `⬅️  Navigated back to: ${page.url()}`
            }
          ]
        };
      }

      case "browser-go-forward": {
        const page = await browserManager.getPage();
        await page.goForward();
        return {
          content: [
            {
              type: "text",
              text: `➡️  Navigated forward to: ${page.url()}`
            }
          ]
        };
      }

      case "browser-reload": {
        const page = await browserManager.getPage();
        await page.reload();
        return {
          content: [
            {
              type: "text",
              text: `🔄 Page reloaded: ${page.url()}`
            }
          ]
        };
      }

      case "browser-close": {
        await browserManager.close();
        return {
          content: [
            {
              type: "text",
              text: `🔒 Browser closed. Profile saved - your logins are preserved!`
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown Playwright tool: ${name}`);
    }
  } catch (error) {
    console.error(`❌ Playwright tool error [${name}]:`, error);
    throw error;
  }
}
