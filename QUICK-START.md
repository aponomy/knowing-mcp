# Quick Start Guide - knowing-mcp

Get up and running with knowing-mcp in 5 minutes.

## Prerequisites

- ✅ Node.js v18 or higher
- ✅ VS Code with GitHub Copilot extension
- ✅ GitHub Personal Access Token

## Step 1: Install (2 minutes)

```bash
# Clone the repository
cd ~/Github  # or your preferred location
git clone https://github.com/aponomy/knowing-mcp.git
cd knowing-mcp

# Install dependencies
npm install
```

## Step 2: Configure (2 minutes)

### Get Your GitHub Token

1. Go to: https://github.com/settings/tokens/new
2. Token name: `knowing-mcp`
3. Select scopes: `repo`, `project`, `read:org`
4. Generate and copy the token

### Create MCP Configuration

> **Important**: MCP servers go in `mcp.json`, NOT `settings.json`

Create: `~/Library/Application Support/Code/User/mcp.json`

```json
{
  "servers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Github/knowing-mcp/src/server.mjs"],
      "env": {
        "GH_TOKEN": "${input:gh-token}"
      }
    }
  },
  "inputs": {
    "gh-token": "ghp_your_actual_token_here"
  }
}
```

**Replace**:
- `/Users/YOUR_USERNAME/...` with your actual path (run `pwd` in the knowing-mcp directory)
- `ghp_your_actual_token_here` with your GitHub token

## Step 3: Reload (30 seconds)

Press `Cmd+Shift+P` → **"Developer: Reload Window"**

## Step 4: Test (30 seconds)

In Copilot Chat, type:

```
List issues in aponomy/knowing-mcp
```

✅ **Success!** The agent should call the `issue-list` tool and show results.

## What's Next?

### Add Azure OpenAI (Optional)

For the `ask-expert` tool, add Azure credentials to your `mcp.json`:

```json
{
  "servers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Github/knowing-mcp/src/server.mjs"],
      "env": {
        "GH_TOKEN": "${input:gh-token}",
        "AZURE_OPENAI_ENDPOINT": "${input:azure-endpoint}",
        "AZURE_OPENAI_API_KEY": "${input:azure-key}",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "${input:azure-deployment}"
      }
    }
  },
  "inputs": {
    "gh-token": "ghp_your_token",
    "azure-endpoint": "https://your-resource.openai.azure.com",
    "azure-key": "your_azure_key",
    "azure-deployment": "gpt-4o-realtime"
  }
}
```

### Try More Commands

```
"Create an issue in facebook/react titled 'Documentation update'"
"Show me issue #1 in microsoft/vscode"
"List closed issues in nodejs/node"
```

## Troubleshooting

**Server not starting?**
- Check `mcp.json` is valid JSON
- Verify the path to `server.mjs` is correct and absolute
- Check VS Code Developer Console (`Cmd+Option+I`) for errors

**Tools not appearing?**
- Look for "Connection state: Running" in Developer Console
- Check for "Discovered 11 tools" message
- Reload window again

**Authentication errors?**
- Verify token has scopes: `repo`, `project`, `read:org`
- Test token at https://github.com/settings/tokens

## Full Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete setup instructions
- [README](README.md) - Full feature overview
- [Contributing](CONTRIBUTING.md) - How to contribute

---

**You're all set!** 🎉 The MCP server is now available in all your VS Code workspaces.

```bash
cd tools/knowing-mcp
npm install
```

### 2. Test Your Setup (1 minute)

```bash
node test-connection.mjs
```

Expected output:
```
✅ Detected GitHub repo: owner/repo
✅ Found .git directory
✅ node_modules found
✅ server.mjs found
```

### 3. Configure Credentials (2 minutes)

**Get your GitHub token:**
- Visit: https://github.com/settings/tokens/new
- Name: `knowing-mcp`
- Scopes: `repo`, `project`
- Generate and copy token

**Add to VS Code User Settings:**

```
Cmd+Shift+P → "Preferences: Open User Settings (JSON)"
```

Add this block:

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/knowing-mcp/server.mjs"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GH_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Get your absolute path:**
```bash
cd tools/knowing-mcp
pwd  # Copy this output
# Add "/server.mjs" to the end
```

**Add Azure OpenAI (optional):**
```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GH_TOKEN": "ghp_YOUR_TOKEN",
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
        "AZURE_OPENAI_API_KEY": "your_key",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  }
}
```

### 4. Reload VS Code (30 seconds)

```
Cmd+Shift+P → "Developer: Reload Window"
```

### 5. Test It! (30 seconds)

Open any workspace with a GitHub remote, then in Copilot Chat:

```
List all open issues
```

**Success!** 🎉 You should see a list of issues from your current repository.

## Common Issues

### "Cannot find module"
**Fix:** Check the path in User Settings is absolute (starts with `/` on Mac/Linux or `C:\` on Windows)

### "Missing env GH_TOKEN"
**Fix:** 
1. Verify token is in User Settings `env` block
2. Reload VS Code window
3. Check token is valid at https://github.com/settings/tokens

### "Could not determine GitHub repository"
**Fix:**
1. Ensure workspace has a git remote:
   ```bash
   git remote -v
   ```
2. Or specify owner/repo explicitly in commands

## Next Steps

- 📖 Read [README.md](README.md) for full documentation
- 🔧 See [VSCODE-SETUP.md](VSCODE-SETUP.md) for detailed configuration
- 🚀 Check [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) if coming from mcp-gullers-dev

## Quick Reference

### Basic Commands (in Copilot Chat)

```
# Issue management
"List all open issues"
"Show me issue #42"
"Create issue titled 'Fix login bug' with label 'bug'"
"Close issue #42 with comment 'Fixed in PR #43'"
"Add comment to issue #42: 'Working on this'"

# No need to specify owner/repo - auto-detected! ✨
```

### With Azure OpenAI

```
# Expert assistance
"I need expert help with [complex technical problem]"

# Architecture questions (requires .vscode/docs/ARCHITECTURE.md)
"What's our circuit breaker strategy?"
"How do we handle Dataverse outages?"
```

## Tips

💡 **Works in ANY workspace** - Configure once, use everywhere!

💡 **Auto-detection** - No need to remember owner/repo names

💡 **Override when needed** - Can still specify `owner`/`repo` explicitly

💡 **Secure credentials** - Use `~/.knowing-mcp.env` instead of User Settings for better security

---

**Ready to go!** Open any GitHub project and start using the MCP tools. 🚀
