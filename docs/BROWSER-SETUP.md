# Browser Automation Setup Guide

## Quick Setup (5 Minutes)

### 1. Install Dependencies

Already done if you ran `npm install`:

```bash
cd /Users/klas.ehnemark/Github/knowing-mcp
npm install
# Playwright and Chrome are automatically installed
```

### 2. Test Browser Automation

Run the test script to verify everything works:

```bash
npm run test:browser
```

This will:
- ✅ Launch Chrome browser (visible window)
- ✅ Navigate to example.com
- ✅ Extract page content
- ✅ Execute JavaScript
- ✅ Keep browser open for 30 seconds (so you can see it)
- ✅ Close browser and save session

### 3. Configure VS Code (If Not Already Done)

Your MCP server configuration should already include browser support. Verify your `mcp.json` or settings:

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/Users/klas.ehnemark/Github/knowing-mcp/src/server.mjs"],
      "env": {
        "GH_TOKEN": "your-github-token",
        "AZURE_OPENAI_API_KEY": "your-key",
        "AZURE_OPENAI_ENDPOINT": "your-endpoint",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5",
        "BROWSER_USER_DATA_DIR": "/Users/klas.ehnemark/.mcp-chrome"
      }
    }
  }
}
```

### 4. Reload VS Code Window

After configuration:
- Press `Cmd+Shift+P`
- Type "Developer: Reload Window"
- Or just restart VS Code

### 5. Test with Copilot

Open GitHub Copilot Chat and try:

```
"Navigate to https://example.com"
```

You should see:
- Chrome browser opens (visible window!)
- Navigates to example.com
- Copilot reports success

## First-Time Browser Usage

### Initial Launch

The first time you use browser automation:

1. **Browser Opens**: A Chrome window appears
2. **Visible Window**: You can see everything happening
3. **Profile Created**: A new profile is created at `~/.mcp-chrome`

### Manual Login Workflow

For sites requiring authentication (Azure, GitHub, etc.):

```
User: "Navigate to https://portal.azure.com"
Copilot: ✅ Navigated to: https://portal.azure.com

*Browser window is visible - you can now manually log in*

User: *Logs into Azure Portal manually*
User: "Click on Create a Resource"

Copilot: ✅ Clicked: [aria-label='Create a resource']
*Session is now saved - you won't need to log in again!*
```

### Subsequent Uses

Next time you use browser automation:

```
User: "Navigate to Azure Portal"
Copilot: ✅ Navigated to: https://portal.azure.com
*Already logged in - session was preserved!*
```

## Environment Variables

### BROWSER_USER_DATA_DIR

Controls where browser profile/sessions are stored:

**Default:** `~/.mcp-chrome`

**Custom location:**
```json
"env": {
  "BROWSER_USER_DATA_DIR": "/custom/path/to/profile"
}
```

**Multiple profiles for different purposes:**

```json
// Work profile
"BROWSER_USER_DATA_DIR": "/Users/klas/.mcp-chrome-work"

// Personal profile
"BROWSER_USER_DATA_DIR": "/Users/klas/.mcp-chrome-personal"
```

## Verifying Installation

### Check Playwright

```bash
npx playwright --version
# Should show: Version 1.49.0 (or similar)
```

### Check Chrome Installation

```bash
npx playwright install chrome --dry-run
# Should show Chrome is installed
```

### Check Browser Profile

```bash
ls -la ~/.mcp-chrome
# Should show browser profile directory (after first use)
```

## Common Setup Issues

### Issue: Chrome Won't Launch

**Error:** `Browser launch failed`

**Solution:**
```bash
# Reinstall Chrome
npx playwright install --force chrome

# Verify
npx playwright --version
```

### Issue: Browser Opens But Immediately Closes

**Cause:** Server might be terminating too early

**Solution:** This is expected after tool execution completes. Browser stays open during active automation.

### Issue: Can't Find Browser Profile

**Cause:** Directory doesn't exist yet

**Solution:** Profile is created automatically on first browser use. Check after using a browser tool.

### Issue: Session Not Persisting

**Cause:** Using wrong profile directory or site clears cookies

**Solution:**
1. Verify `BROWSER_USER_DATA_DIR` is set correctly
2. Check directory exists: `ls -la ~/.mcp-chrome`
3. Some sites expire sessions - just log in again manually

## macOS Permissions

### Screen Recording Permission

If you get permission errors for screenshots:

1. Go to **System Preferences → Security & Privacy → Privacy**
2. Select **Screen Recording**
3. Add VS Code or Terminal (depending on how you run the server)
4. Restart VS Code

### Accessibility Permission

If automation has trouble clicking elements:

1. Go to **System Preferences → Security & Privacy → Privacy**
2. Select **Accessibility**
3. Add VS Code or Terminal
4. Restart VS Code

## Testing Checklist

Run through this checklist to verify everything works:

- [ ] `npm install` completed successfully
- [ ] `npm run test:browser` runs and opens browser
- [ ] Browser window is visible (headed mode)
- [ ] Test navigates to example.com
- [ ] Test extracts page content
- [ ] Browser closes after 30 seconds
- [ ] VS Code MCP configuration includes browser env vars
- [ ] Copilot Chat shows browser tools available
- [ ] Can execute: "Navigate to https://example.com"
- [ ] Browser profile created at `~/.mcp-chrome`

## Next Steps

Once setup is complete:

1. **Read Documentation:**
   - [BROWSER-AUTOMATION.md](BROWSER-AUTOMATION.md) - Complete tool reference
   - [BROWSER-EXAMPLES.md](BROWSER-EXAMPLES.md) - Real-world examples

2. **Try Simple Commands:**
   ```
   "Navigate to https://github.com"
   "Get the page title"
   "Take a screenshot"
   ```

3. **Test Manual Login:**
   ```
   "Navigate to https://portal.azure.com"
   *Log in manually*
   "Click on Resource Groups"
   ```

4. **Build Complex Automation:**
   - See [BROWSER-EXAMPLES.md](BROWSER-EXAMPLES.md) for use cases
   - Azure Portal automation
   - GitHub workflows
   - Form filling
   - Data extraction

## Support

### Getting Help

- **Documentation:** See BROWSER-AUTOMATION.md
- **Examples:** See BROWSER-EXAMPLES.md
- **Troubleshooting:** See both docs for common issues
- **Issues:** Open issue on GitHub repo

### Debugging Tips

1. **Browser is visible** - watch what's happening in real-time
2. **Take screenshots** - `browser-screenshot` before/after actions
3. **Check browser console** - visible in DevTools (F12)
4. **Test selectors** - use `browser-evaluate` to test queries
5. **Check server logs** - look at VS Code console output

---

**You're all set! Start automating! 🚀**
