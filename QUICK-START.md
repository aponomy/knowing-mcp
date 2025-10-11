# Quick Start Guide - knowing-mcp

Get up and running in 5 minutes!

## Prerequisites

- ✅ Node.js installed (v16 or higher)
- ✅ VS Code with GitHub Copilot
- ✅ GitHub account with Personal Access Token
- ✅ Azure OpenAI access (optional, for ask-expert/ask-architect)

## Installation

### 1. Install Dependencies (2 minutes)

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
