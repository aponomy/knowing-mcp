# Browser Automation with Playwright

## Overview

The knowing-mcp server now includes powerful browser automation capabilities using Playwright. This allows GitHub Copilot (or other MCP clients) to control a Chrome browser to automate web tasks while maintaining persistent login sessions.

## Key Features

✅ **Always Visible (Headed Mode)** - Browser window is always visible so you can see what's happening  
✅ **Persistent Sessions** - Login once, sessions are saved across restarts  
✅ **Chrome Only** - Uses Chrome browser for best compatibility  
✅ **Manual Login Support** - You can manually log into services when needed  
✅ **Rich Automation** - Navigate, click, type, screenshot, and more  
✅ **Integrated with MCP** - All browser actions available as MCP tools  

## Installation

1. **Install Playwright and Chrome**:
```bash
npm install
# This automatically runs: playwright install chrome
```

2. **Verify Installation**:
```bash
npx playwright --version
```

## Configuration

### Browser Profile Location

By default, browser profile data is stored at `~/.mcp-chrome`. You can customize this:

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/path/to/knowing-mcp/src/server.mjs"],
      "env": {
        "BROWSER_USER_DATA_DIR": "/custom/path/to/browser/profile",
        "GH_TOKEN": "your-github-token",
        "AZURE_OPENAI_API_KEY": "your-key",
        "AZURE_OPENAI_ENDPOINT": "your-endpoint",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  }
}
```

## Workflow: Manual Login + Agent Automation

### 1. First Time Setup - Manual Login

When you first use browser automation, you'll need to log into services manually:

```
User: "Navigate to https://portal.azure.com"
Copilot: *browser opens and navigates to Azure Portal*

User: *manually logs in to Azure Portal in the visible browser*
```

The browser uses a persistent profile, so your login cookies are saved.

### 2. Automated Tasks (Subsequent Uses)

On future uses, you're already logged in:

```
User: "Navigate to Azure Portal and create a new resource group called 'test-rg' in West US 2"
Copilot: *automates the task using your existing logged-in session*
```

### 3. Session Persistence

- Logins persist even after browser closes
- Cookies and local storage are preserved
- No need to log in again unless session expires
- Profile stored in `~/.mcp-chrome` by default

## Available Browser Tools

### Navigation

#### `browser-navigate`
Navigate to a URL.

```typescript
{
  url: string,           // URL to visit (must include https://)
  waitUntil?: "load" | "domcontentloaded" | "networkidle"
}
```

**Example**: "Navigate to https://github.com"

#### `browser-go-back`
Go back in browser history.

**Example**: "Go back to the previous page"

#### `browser-go-forward`
Go forward in browser history.

**Example**: "Go forward one page"

#### `browser-reload`
Reload the current page.

**Example**: "Reload the page"

#### `browser-get-url`
Get the current page URL.

**Example**: "What URL am I on?"

### Element Interaction

#### `browser-click`
Click an element using CSS selector.

```typescript
{
  selector: string,      // CSS selector
  timeout?: number       // Max wait time in ms (default: 30000)
}
```

**Example**: "Click the button with class 'submit-btn'"

#### `browser-type`
Type text into an input field.

```typescript
{
  selector: string,      // CSS selector for input
  text: string,          // Text to type
  clear?: boolean,       // Clear existing text first (default: true)
  delay?: number         // Delay between keystrokes in ms
}
```

**Example**: "Type 'test-rg' into the input with id 'resource-group-name'"

#### `browser-fill`
Fill a form field (more reliable than type for forms).

```typescript
{
  selector: string,      // CSS selector
  value: string          // Value to fill
}
```

**Example**: "Fill the email field with 'user@example.com'"

#### `browser-press`
Press a key or key combination.

```typescript
{
  key: string,           // Key name (e.g., 'Enter', 'Escape', 'Control+C')
  selector?: string      // Optional: focus element first
}
```

**Example**: "Press Enter to submit the form"

#### `browser-hover`
Hover over an element.

```typescript
{
  selector: string       // CSS selector
}
```

**Example**: "Hover over the dropdown menu"

#### `browser-select`
Select option from a dropdown.

```typescript
{
  selector: string,      // CSS selector for <select>
  value: string          // Value, label, or index to select
}
```

**Example**: "Select 'West US 2' from the region dropdown"

### Content Extraction

#### `browser-get-content`
Get HTML content from page or element.

```typescript
{
  selector?: string      // Optional: specific element to get content from
}
```

**Example**: "Get the HTML content of the main article"

#### `browser-get-text`
Get visible text from page or element.

```typescript
{
  selector?: string      // Optional: specific element to get text from
}
```

**Example**: "Get the text from the error message"

### Waiting & Synchronization

#### `browser-wait-for`
Wait for an element to appear or reach a state.

```typescript
{
  selector: string,      // CSS selector
  state?: "attached" | "detached" | "visible" | "hidden",
  timeout?: number       // Max wait time in ms (default: 30000)
}
```

**Example**: "Wait for the loading spinner to disappear"

### Screenshots

#### `browser-screenshot`
Take a screenshot of the page or element.

```typescript
{
  path?: string,         // Optional: save to file path
  selector?: string,     // Optional: screenshot specific element
  fullPage?: boolean     // Capture full scrollable page (default: false)
}
```

**Example**: "Take a screenshot and save it to ~/screenshot.png"

### JavaScript Execution

#### `browser-evaluate`
Execute JavaScript in the page context.

```typescript
{
  script: string         // JavaScript code to execute
}
```

**Example**: "Execute: document.title"

### Browser Management

#### `browser-close`
Close the browser (sessions are saved).

**Example**: "Close the browser"

## Usage Examples

### Example 1: Simple Navigation and Click

```
User: "Go to GitHub and click the 'New repository' button"

Copilot executes:
1. browser-navigate { url: "https://github.com" }
2. browser-wait-for { selector: "a[href='/new']" }
3. browser-click { selector: "a[href='/new']" }
```

### Example 2: Form Filling

```
User: "Fill out the form with name 'John Doe' and email 'john@example.com'"

Copilot executes:
1. browser-fill { selector: "#name", value: "John Doe" }
2. browser-fill { selector: "#email", value: "john@example.com" }
3. browser-press { key: "Enter", selector: "#submit-button" }
```

### Example 3: Data Extraction

```
User: "Get the title and description from the product page"

Copilot executes:
1. browser-get-text { selector: "h1.product-title" }
2. browser-get-text { selector: ".product-description" }
```

### Example 4: Azure Portal Automation

```
User: "Create a new resource group in Azure Portal"

First time (manual login):
1. browser-navigate { url: "https://portal.azure.com" }
2. *User manually logs in*
3. browser-click { selector: "[aria-label='Create a resource']" }
4. ... continues automation

Next time (already logged in):
1. browser-navigate { url: "https://portal.azure.com" }
   *Already logged in from persistent session*
2. browser-click { selector: "[aria-label='Create a resource']" }
3. ... continues automation
```

## CSS Selectors Quick Reference

Common selector patterns:

- **ID**: `#my-id`
- **Class**: `.my-class`
- **Attribute**: `[data-testid='submit']`
- **Aria Label**: `[aria-label='Search']`
- **Text content**: `text=Login` or `button:has-text("Login")`
- **Combination**: `button.primary[type='submit']`

## Troubleshooting

### Browser Won't Launch

```bash
# Reinstall Chrome
npx playwright install chrome

# Check Playwright installation
npx playwright --version
```

### Lost Login Sessions

If sessions aren't persisting:

1. Check browser profile directory exists:
   ```bash
   ls -la ~/.mcp-chrome
   ```

2. Verify BROWSER_USER_DATA_DIR environment variable is set correctly

3. Don't use "Incognito" or "Private" mode features

### Element Not Found

If selectors aren't working:

1. Use browser DevTools (visible in headed mode) to inspect elements
2. Try waiting for element first: `browser-wait-for`
3. Use more specific selectors
4. Check if page needs time to load dynamic content

### Browser Permissions on macOS

If browser can't access certain features:

1. Go to **System Preferences → Security & Privacy → Privacy**
2. Grant permissions for:
   - Screen Recording (for screenshots)
   - Accessibility (for automation)

## Security Considerations

- **Profile Security**: Browser profile contains cookies and session data
  - Store `~/.mcp-chrome` securely
  - Don't share profile directory
  - Add to `.gitignore` if storing custom location in project

- **Credentials**: Never hardcode passwords in automation scripts
  - Use manual login for sensitive accounts
  - Let persistent sessions handle authentication

- **Visibility**: Headed mode is a security feature
  - You can always see what the browser is doing
  - Prevents hidden malicious actions

## Best Practices

1. **Manual Login First**: For sensitive sites (banks, cloud providers), manually log in the first time

2. **Wait for Elements**: Always use `browser-wait-for` before interacting with dynamic content

3. **Use Specific Selectors**: Prefer IDs and data attributes over classes

4. **Error Handling**: Tools will throw errors if elements aren't found - this is expected

5. **Screenshots**: Take screenshots before and after important actions for debugging

6. **Session Management**: 
   - Close browser when done for long periods
   - Sessions persist but may expire based on site policies
   - Re-login manually when needed

## Advanced: Custom Browser Profile

For multiple isolated sessions:

```bash
# Create separate profiles for different purposes
export BROWSER_USER_DATA_DIR="$HOME/.mcp-chrome-work"
export BROWSER_USER_DATA_DIR="$HOME/.mcp-chrome-personal"
```

## Examples by Use Case

### Use Case: Azure DevOps Pipeline Monitoring

```
"Navigate to our Azure DevOps pipeline and tell me the status of the last build"

1. browser-navigate { url: "https://dev.azure.com/org/project" }
2. browser-wait-for { selector: ".build-status" }
3. browser-get-text { selector: ".build-status .latest" }
```

### Use Case: GitHub PR Creation

```
"Create a PR from my feature branch to main"

1. browser-navigate { url: "https://github.com/owner/repo" }
2. browser-click { selector: ".pull-request-link" }
3. browser-select { selector: "#base-branch", value: "main" }
4. browser-select { selector: "#compare-branch", value: "feature" }
5. browser-fill { selector: "#pr-title", value: "Add new feature" }
6. browser-click { selector: "#create-pr" }
```

### Use Case: Dashboard Monitoring

```
"Check our production dashboard and screenshot any error alerts"

1. browser-navigate { url: "https://dashboard.company.com" }
2. browser-wait-for { selector: ".metrics-loaded" }
3. browser-evaluate { script: "document.querySelectorAll('.alert-error').length" }
4. browser-screenshot { path: "~/dashboard-errors.png" }
```

## Limitations

- **Chrome Only**: No Firefox or Safari support (macOS has Safari available but we use Chrome for consistency)
- **No Mobile Emulation**: Desktop browser only
- **Single Browser Instance**: One browser per server instance
- **macOS Only**: This implementation is optimized for macOS

## Future Enhancements

Potential features for future versions:

- Multiple browser tabs management
- Browser context switching
- Mobile device emulation
- Network request interception
- Cookie/storage management APIs
- File upload/download helpers

## Support

For issues or questions:
- Check the troubleshooting section above
- Review browser console (visible in headed mode)
- Check knowing-mcp server logs
- Open an issue on GitHub

---

**Remember**: The browser is ALWAYS visible. You can watch, intervene, or manually complete tasks if needed. This is a feature, not a bug! 🎉
