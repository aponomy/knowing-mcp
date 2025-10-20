# Browser Automation - Quick Start Checklist

## ✅ Pre-Flight Checklist

Use this checklist to get up and running quickly.

### 1. Installation ✅ (Already Done)

- [x] `npm install` completed
- [x] Playwright installed
- [x] Chrome browser installed

**Verify:**
```bash
npm run test:browser
```

### 2. Configuration

#### A. Check VS Code MCP Settings

Your settings should look like this (in VS Code User Settings JSON):

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/Users/klas.ehnemark/Github/knowing-mcp/src/server.mjs"],
      "env": {
        "GH_TOKEN": "your-github-token",
        "AZURE_OPENAI_API_KEY": "your-azure-key",
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  }
}
```

#### B. Optional: Custom Browser Profile

If you want a custom browser profile location:

```json
"env": {
  ...existing vars...,
  "BROWSER_USER_DATA_DIR": "/Users/klas/.mcp-chrome"
}
```

### 3. VS Code Reload

- [ ] Press `Cmd+Shift+P`
- [ ] Type "Developer: Reload Window"
- [ ] Or restart VS Code

### 4. First Test

#### A. Open Copilot Chat

Click the chat icon or press `Cmd+Shift+I`

#### B. Try Simple Command

```
Navigate to https://example.com
```

**Expected Result:**
- Chrome browser window opens (visible!)
- Navigates to example.com
- Copilot reports: "🌐 Navigated to: https://example.com/"

### 5. Advanced Test - Manual Login

#### A. Navigate to Authenticated Site

```
Navigate to https://portal.azure.com
```

#### B. Manual Login

- Browser opens to Azure Portal
- You manually log in with your Microsoft account
- Close browser or continue automation

#### C. Next Session

```
Navigate to https://portal.azure.com
```

**Expected Result:**
- Already logged in!
- Session was preserved from previous use

## 🎯 Quick Command Examples

### Navigation
```
Navigate to https://github.com
Go back
Go forward
Reload the page
What URL am I on?
```

### Content Extraction
```
Get the page title
Get the text from the main heading
Get the page content
Take a screenshot
```

### Interaction
```
Click the login button
Type "test" into the search box
Fill the email field with "user@example.com"
Press Enter
Hover over the menu
```

### Advanced
```
Execute JavaScript: document.title
Wait for the loading spinner to appear
Close the browser
```

## 📚 Documentation Quick Links

- **[BROWSER-AUTOMATION.md](BROWSER-AUTOMATION.md)** - Complete tool reference
- **[BROWSER-EXAMPLES.md](BROWSER-EXAMPLES.md)** - 10 real-world use cases
- **[BROWSER-SETUP.md](BROWSER-SETUP.md)** - Detailed setup guide
- **[PLAYWRIGHT-IMPLEMENTATION-SUMMARY.md](PLAYWRIGHT-IMPLEMENTATION-SUMMARY.md)** - What was implemented

## 🔍 Troubleshooting Quick Fixes

### Browser Won't Open

```bash
# Reinstall Chrome
npx playwright install --force chrome

# Test directly
npm run test:browser
```

### Tools Not Showing in Copilot

1. Reload VS Code window (`Cmd+Shift+P` → "Reload Window")
2. Check MCP server is configured in User Settings (not workspace settings)
3. Verify path to server.mjs is correct

### Session Not Persisting

1. Check browser profile exists:
   ```bash
   ls -la ~/.mcp-chrome
   ```

2. Verify you're not using incognito/private mode

3. Some sites expire sessions - just log in again

### Element Not Found

1. Open browser DevTools (F12) - browser is visible!
2. Inspect the element
3. Copy the selector
4. Use more specific selector:
   - ID: `#element-id`
   - Attribute: `[data-testid='button']`
   - Text: `button:has-text('Submit')`

## 🎯 Success Indicators

You'll know it's working when:

- ✅ Browser window opens and is visible
- ✅ You can see navigation happening in real-time
- ✅ Copilot reports successful actions
- ✅ Screenshots are captured
- ✅ Content is extracted correctly
- ✅ Manual logins persist across sessions

## 💡 Pro Tips

1. **Watch the Browser**
   - The window is visible - watch what happens
   - Intervene manually if needed
   - Debug issues in real-time

2. **Take Screenshots**
   - Before and after actions
   - Debug selector issues
   - Verify state

3. **Use Specific Selectors**
   - IDs are best: `#element-id`
   - Data attributes: `[data-testid='btn']`
   - Avoid generic: `.button` (too many matches)

4. **Wait for Elements**
   - Dynamic content needs waiting
   - Use `browser-wait-for` before clicking
   - Check page load indicators

5. **Build Incrementally**
   - Test each step
   - Take screenshots between steps
   - Adjust selectors as needed

## 🚀 Next Steps

### Beginner
1. Navigate to familiar websites
2. Extract simple content
3. Take screenshots
4. Practice with selectors

### Intermediate
1. Fill out forms
2. Click through multi-step processes
3. Extract structured data
4. Use wait commands

### Advanced
1. Azure Portal automation
2. GitHub workflow automation
3. Complex form submissions
4. Dashboard monitoring
5. E-commerce automation

## 🔗 Resources

### CSS Selectors
- ID: `#my-id`
- Class: `.my-class`
- Attribute: `[name='username']`
- Text: `text=Login`
- Combination: `button.primary[type='submit']`

### Common Patterns
```javascript
// Click button by text
browser-click { selector: "button:has-text('Submit')" }

// Fill form field
browser-fill { selector: "#email", value: "user@example.com" }

// Wait for content
browser-wait-for { selector: ".content-loaded" }

// Take screenshot
browser-screenshot { path: "~/screenshot.png" }

// Get text
browser-get-text { selector: "h1" }
```

## ✅ Final Checklist

Before reporting issues, verify:

- [ ] `npm install` completed successfully
- [ ] `npm run test:browser` passes
- [ ] Chrome opens in headed mode (visible)
- [ ] VS Code MCP configuration is in User Settings
- [ ] VS Code window was reloaded after configuration
- [ ] Browser tools appear in Copilot Chat
- [ ] Simple navigation command works
- [ ] Browser profile directory exists (`~/.mcp-chrome`)

## 🎉 You're Ready!

If all checks pass, you're ready to start automating!

Try this complete example:

```
Navigate to https://github.com
Click the search button
Type "playwright" into the search box
Press Enter
Wait for search results to load
Take a screenshot
Get the first result text
```

---

**Happy Automating! 🚀**

Questions? Check the documentation:
- [BROWSER-AUTOMATION.md](BROWSER-AUTOMATION.md) - Complete reference
- [BROWSER-EXAMPLES.md](BROWSER-EXAMPLES.md) - Real-world examples
- [BROWSER-SETUP.md](BROWSER-SETUP.md) - Setup guide
