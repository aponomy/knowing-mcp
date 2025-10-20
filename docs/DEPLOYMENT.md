# VS Code MCP Deployment Guide

> **Updated**: October 2025 - Reflects actual working configuration

This guide shows how to deploy the knowing-mcp server globally in VS Code, making it available in all workspaces.

## 🎯 How It Actually Works

### Key Facts
- **MCP servers are configured in `mcp.json`, NOT `settings.json`**
- **User-level config**: `~/Library/Application Support/Code/User/mcp.json` (global)
- **Workspace-level config**: `.vscode/mcp.json` (per-workspace, optional)
- **VS Code variables like `${workspaceFolder}` only work in workspace configs**
- **Global servers must use explicit parameters for repository operations**

## 📋 Prerequisites

1. **Node.js** v18 or higher
2. **VS Code** with GitHub Copilot extension
3. **GitHub Personal Access Token** with scopes: `repo`, `project`, `read:org`
4. **Azure OpenAI** credentials (optional, for ask-expert tool)

## 🚀 Installation Steps

### 1. Clone and Install

```bash
# Clone to a permanent location
cd ~/Github  # or your preferred location
git clone https://github.com/aponomy/knowing-mcp.git
cd knowing-mcp

# Install dependencies
npm install
```

### 2. Create Global Credentials File

Create `~/.knowing-mcp.env` with your credentials:

```bash
# GitHub Personal Access Token
GH_TOKEN=ghp_your_token_here

# Azure OpenAI Configuration (optional)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-4o-realtime
```

**Getting your tokens:**
- GitHub Token: https://github.com/settings/tokens/new (scopes: `repo`, `project`, `read:org`)
- Azure OpenAI: Azure Portal → Your OpenAI resource → Keys and Endpoint

### 3. Configure VS Code MCP

**Important**: MCP servers are configured in `mcp.json`, NOT in `settings.json`.

Create or edit: `~/Library/Application Support/Code/User/mcp.json`

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
    "gh-token": "ghp_your_actual_token",
    "azure-endpoint": "https://your-resource.openai.azure.com",
    "azure-key": "your_azure_key",
    "azure-deployment": "gpt-4o-realtime"
  }
}
```

**Replace**:
- `/Users/YOUR_USERNAME/Github/knowing-mcp/src/server.mjs` with the actual path to your server.mjs
- All credential values with your actual tokens

### 4. Reload VS Code

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and run:
```
Developer: Reload Window
```

## ✅ Verify Installation

### Check Server Status

1. Open Copilot Chat
2. Look for the MCP indicator (if visible in UI)
3. Or check VS Code Developer Tools Console:
   - `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
   - Look for: "Connection state: Running" and "Discovered 11 tools"

### Test the Tools

In Copilot Chat, try:

```
List issues in aponomy/knowing-mcp
```

The agent should call the `issue-list` tool with the specified owner and repo.

## 🛠️ Available Tools

### GitHub Tools (require owner/repo parameters)

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `issue-list` | List issues | `owner`, `repo` |
| `issue-create` | Create an issue | `owner`, `repo`, `title` |
| `issue-get` | Get issue details | `owner`, `repo`, `issue_number` |
| `issue-update` | Update an issue | `owner`, `repo`, `issue_number` |
| `issue-close` | Close an issue | `owner`, `repo`, `issue_number` |
| `issue-comment` | Comment on issue | `owner`, `repo`, `issue_number`, `body` |

### Project Tools

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `project-get` | Get project info | `owner`, `number` |
| `project-item-add` | Add item to project | `projectId`, `contentId` |
| `project-draft-issue` | Create draft issue | `projectId`, `title` |

### AI Tools (no repo needed)

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `ask-expert` | Ask Azure OpenAI GPT-5 | `question`, `context` |
| `ask-architect` | Query architecture docs | `question` |

## 🎯 Usage Patterns

### Explicit Repository References

Because the server is configured globally, you must specify the repository:

```
# Natural language - agent extracts owner/repo
"List issues in aponomy/knowing-mcp"
"Create an issue in microsoft/vscode titled 'Bug fix'"

# Agent determines parameters from context
"Show me issue #42 in this repo"  # Needs repo context in conversation
```

### Working with Multiple Repos

The agent can work with different repos in the same session:

```
"List issues in aponomy/knowing-mcp"
"Now show issues in microsoft/vscode"
"Create an issue in facebook/react titled 'Documentation update'"
```

Each command explicitly specifies which repository to use.

## 🔧 Troubleshooting

### Server Not Starting

1. **Check mcp.json syntax**: Ensure valid JSON
2. **Verify paths**: Server path must be absolute and correct
3. **Check Node.js**: Run `node --version` (needs v18+)
4. **View logs**: Open VS Code Developer Tools Console

### Tools Not Appearing

1. **Verify server is running**: Check Developer Console for "Connection state: Running"
2. **Check tool discovery**: Look for "Discovered 11 tools"
3. **Reload window**: `Cmd+Shift+P` → "Developer: Reload Window"
4. **Enable tools per-agent**: Tools must be enabled for each agent/chat session

### Authentication Errors

1. **Verify token scopes**: GitHub token needs `repo`, `project`, `read:org`
2. **Check credentials**: Ensure values in mcp.json are correct
3. **Test token**: Visit https://github.com/settings/tokens
4. **Check Azure keys**: Verify in Azure Portal

### "Could not determine repository" Error

**This error should NOT happen anymore** with the updated configuration. All GitHub tools now require explicit `owner` and `repo` parameters.

If you see this error:
1. Reload VS Code window
2. Verify the server.mjs is the updated version
3. Check that required parameters are marked in tool schema

## 📝 Configuration Differences

### What Changed from Initial Design

| Aspect | Initial Design | Actual Implementation |
|--------|---------------|----------------------|
| **Config file** | `settings.json` | `mcp.json` |
| **Location** | `github.copilot.chat.mcpServers` | `servers` in mcp.json |
| **Workspace vars** | `${workspaceFolder}` in global | Not supported in global config |
| **Repo detection** | Automatic from workspace | Explicit owner/repo required |
| **Environment** | Passed via `env` object | Uses `inputs` for credentials |

### Why owner/repo are Required

Global MCP servers cannot automatically detect which workspace VS Code is currently using because:
- MCP protocol doesn't define "workspace" concept
- VS Code doesn't pass workspace context to global servers
- `process.cwd()` is the user's home directory, not the workspace

Making `owner` and `repo` required ensures:
- ✅ Clear, explicit operations
- ✅ Works in any workspace
- ✅ No silent failures or confusing errors
- ✅ Agent can intelligently extract from conversation context

## 🎓 Best Practices

1. **Keep credentials secure**: Use environment variables, never commit tokens
2. **Use `.knowing-mcp.env`**: Store credentials in home directory
3. **Regular token rotation**: Update GitHub token periodically
4. **Test after updates**: Reload VS Code after any configuration changes
5. **Monitor usage**: Check Developer Console for errors/warnings

## 📚 Additional Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [GitHub Token Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [VS Code MCP Extension Docs](https://code.visualstudio.com/docs/copilot/copilot-extensibility-overview)

## 🔄 Updating the Server

To update to the latest version:

```bash
cd ~/Github/knowing-mcp
git pull origin main
npm install

# Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

## 🆘 Getting Help

- **Issues**: https://github.com/aponomy/knowing-mcp/issues
- **Discussions**: https://github.com/aponomy/knowing-mcp/discussions
- **Documentation**: https://github.com/aponomy/knowing-mcp/blob/main/README.md
