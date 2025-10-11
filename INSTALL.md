# Installation Guide - knowing-mcp

Complete installation instructions for all platforms.

## Quick Install (Recommended)

### Option 1: Install via npm (when published)

```bash
npm install -g knowing-mcp
```

Then configure in VS Code User Settings (see [Configuration](#configuration) below).

### Option 2: Install from GitHub

```bash
# Clone the repository
git clone https://github.com/Gullers-Grupp/knowing-mcp.git
cd knowing-mcp

# Install dependencies
npm install

# Link globally (makes 'knowing-mcp' command available)
npm link
```

### Option 3: Manual Installation

```bash
# Clone to a permanent location
cd ~/
git clone https://github.com/Gullers-Grupp/knowing-mcp.git
cd knowing-mcp
npm install

# Note the full path
pwd
# Copy this path for VS Code configuration
```

## Configuration

### 1. Get Your Credentials

**GitHub Personal Access Token:**
1. Go to: https://github.com/settings/tokens/new
2. Token name: `knowing-mcp`
3. Select scopes:
   - ✅ `repo` (for private repositories)
   - ✅ `public_repo` (for public repositories)
   - ✅ `project` (for GitHub Projects)
   - ✅ `read:org` (for organization access)
4. Generate token and **copy it** (you won't see it again!)

**Azure OpenAI (Optional - for ask-expert and ask-architect):**
1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Go to: **Keys and Endpoint**
4. Copy:
   - Endpoint URL (e.g., `https://your-resource.openai.azure.com`)
   - API Key (Key 1 or Key 2)
   - Deployment name (e.g., `gpt-4o`, `gpt-5`)

### 2. Configure VS Code User Settings

**Open User Settings:**
- **macOS**: `Cmd + Shift + P` → "Preferences: Open User Settings (JSON)"
- **Windows/Linux**: `Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)"

**Add configuration:**

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "knowing-mcp",
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GH_TOKEN": "ghp_your_github_token_here",
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
        "AZURE_OPENAI_API_KEY": "your_azure_key_here",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  }
}
```

**If you installed manually (not globally):**

Replace `"command": "knowing-mcp"` with:
```json
"command": "node",
"args": ["/full/path/to/knowing-mcp/src/server.mjs"],
```

### 3. Alternative: Use Global Config File (More Secure)

Create `~/.knowing-mcp.env`:

```bash
# GitHub
GH_TOKEN=ghp_your_token_here

# Azure OpenAI (optional)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-5
```

Secure the file:
```bash
chmod 600 ~/.knowing-mcp.env
```

Then your VS Code settings can be minimal:
```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "knowing-mcp",
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### 4. Reload VS Code

- **macOS**: `Cmd + Shift + P` → "Developer: Reload Window"
- **Windows/Linux**: `Ctrl + Shift + P` → "Developer: Reload Window"

### 5. Verify Installation

```bash
# Run the test script
cd ~/knowing-mcp  # or wherever you installed it
npm test
```

Expected output:
```
✅ Detected GitHub repo: owner/repo
✅ Found .git directory
✅ server.mjs found
✅ All checks passed!
```

## Platform-Specific Notes

### macOS

- Install location: `~/knowing-mcp` or `/usr/local/lib/node_modules/knowing-mcp` (if global)
- Config file: `~/.knowing-mcp.env`
- Shell: Add to `~/.zshrc` for env vars

### Windows

- Install location: `C:\Users\YourName\knowing-mcp` or `%APPDATA%\npm\node_modules\knowing-mcp` (if global)
- Config file: `%USERPROFILE%\.knowing-mcp.env`
- PowerShell: Set env vars with `$env:GH_TOKEN = "..."`

### Linux

- Install location: `~/knowing-mcp` or `/usr/local/lib/node_modules/knowing-mcp` (if global)
- Config file: `~/.knowing-mcp.env`
- Shell: Add to `~/.bashrc` or `~/.zshrc` for env vars

## Troubleshooting

### "command not found: knowing-mcp"

**Solution:**
1. If installed globally, check npm global bin:
   ```bash
   npm bin -g
   # Add this to your PATH if needed
   ```

2. Or use full path in VS Code settings:
   ```json
   "command": "node",
   "args": ["/full/path/to/knowing-mcp/src/server.mjs"]
   ```

### "Cannot find module '@modelcontextprotocol/sdk'"

**Solution:**
```bash
cd knowing-mcp
npm install
```

### "Missing env GH_TOKEN"

**Solution:**
1. Verify token in VS Code User Settings `env` block
2. Or create `~/.knowing-mcp.env` with token
3. Reload VS Code after changes

### MCP not showing in Copilot

**Solution:**
1. Check Developer Console: `Help` → `Toggle Developer Tools` → Console
2. Look for errors related to MCP
3. Verify command path is correct
4. Restart VS Code completely

## Updating

### If installed via npm:
```bash
npm update -g knowing-mcp
```

### If installed from GitHub:
```bash
cd knowing-mcp
git pull
npm install
```

## Uninstalling

### If installed globally:
```bash
npm uninstall -g knowing-mcp
```

### If linked:
```bash
cd knowing-mcp
npm unlink
```

### Manual cleanup:
```bash
rm -rf ~/knowing-mcp
rm ~/.knowing-mcp.env
# Remove from VS Code User Settings
```

## Next Steps

After installation:
1. Read [QUICK-START.md](QUICK-START.md) for usage examples
2. See [VSCODE-SETUP.md](VSCODE-SETUP.md) for advanced configuration
3. Check [README.md](README.md) for complete documentation

## Support

- **Issues**: https://github.com/Gullers-Grupp/knowing-mcp/issues
- **Discussions**: https://github.com/Gullers-Grupp/knowing-mcp/discussions
- **Documentation**: https://github.com/Gullers-Grupp/knowing-mcp

---

**Successfully installed?** Try it out:
```
# In Copilot Chat (in any workspace with a GitHub remote)
List all open issues
```
