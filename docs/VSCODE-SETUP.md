# VS Code User Settings Setup for knowing-mcp

This guide shows how to configure `knowing-mcp` globally in VS Code so it works in **any workspace**.

## Step-by-Step Setup

### 1. Get Your Absolute Path

First, find the absolute path to `server.mjs`:

```bash
cd tools/knowing-mcp
pwd
```

**Example output:**
```
/Users/klas.ehnemark/Github/gullers-platform/tools/knowing-mcp
```

Your full server path will be:
```
/Users/klas.ehnemark/Github/gullers-platform/tools/knowing-mcp/server.mjs
```

### 2. Get Your Credentials

You'll need:

**GitHub Personal Access Token:**
- Go to: https://github.com/settings/tokens/new
- Token name: `knowing-mcp`
- Scopes: `repo`, `project`, `read:org`
- Generate token and copy it

**Azure OpenAI Credentials:**
- Open Azure Portal
- Navigate to your Azure OpenAI resource
- Go to: **Keys and Endpoint**
- Copy:
  - Endpoint URL (e.g., `https://your-resource.openai.azure.com`)
  - API Key (Key 1 or Key 2)
  - Deployment name (e.g., `gpt-5`, `gpt-4o`)

### 3. Open VS Code User Settings

**macOS:**
```
Cmd + Shift + P → "Preferences: Open User Settings (JSON)"
```

**Windows/Linux:**
```
Ctrl + Shift + P → "Preferences: Open User Settings (JSON)"
```

This opens `settings.json` (your global settings, not workspace-specific).

### 4. Add MCP Configuration

Add or merge this configuration:

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs"
      ],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GH_TOKEN": "ghp_your_github_token_here",
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
        "AZURE_OPENAI_API_KEY": "your_azure_api_key_here",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  }
}
```

**Important:**
- Replace `/Users/YOUR_USERNAME/...` with YOUR actual path from step 1
- Replace `ghp_your_github_token_here` with your GitHub token
- Replace Azure credentials with your actual values

### 5. Example Complete Configuration

Here's what your `settings.json` might look like:

```json
{
  "editor.fontSize": 14,
  "workbench.colorTheme": "Default Dark+",
  
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": [
        "/Users/klas.ehnemark/Github/gullers-platform/tools/knowing-mcp/server.mjs"
      ],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "GH_TOKEN": "ghp_xK9mL2pQ3rN4sT5vW6xY7zA8bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9x",
        "AZURE_OPENAI_ENDPOINT": "https://gullers-openai.openai.azure.com",
        "AZURE_OPENAI_API_KEY": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"
      }
    }
  },
  
  "chat.agent.enabled": true
}
```

### 6. Reload VS Code

**macOS:**
```
Cmd + Shift + P → "Developer: Reload Window"
```

**Windows/Linux:**
```
Ctrl + Shift + P → "Developer: Reload Window"
```

### 7. Verify Installation

Open **any workspace** and in Copilot Chat, try:

```
List all open issues
```

If configured correctly, the MCP will:
1. Detect your workspace's GitHub repo
2. Authenticate with your GitHub token
3. List issues from that repo

## Alternative: Global Config File

If you don't want credentials in VS Code settings, use a global config file:

### Create `~/.knowing-mcp.env`

```bash
# GitHub
GH_TOKEN=ghp_your_token_here

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-5
```

### Secure the file

```bash
chmod 600 ~/.knowing-mcp.env
```

### Update VS Code Settings

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": [
        "/Users/klas.ehnemark/Github/gullers-platform/tools/knowing-mcp/server.mjs"
      ],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

The server will automatically load credentials from `~/.knowing-mcp.env`.

## Troubleshooting

### "Cannot find module"

**Problem:** Wrong path in `args`

**Solution:**
1. Verify path exists:
   ```bash
   ls -la /Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs
   ```
2. Use absolute path, not relative (no `./` or `~/`)

### "Missing env GH_TOKEN"

**Problem:** Credentials not loading

**Solutions:**
1. Check VS Code settings JSON syntax (valid JSON?)
2. Reload VS Code after changes
3. Try global config file approach

### MCP not showing up

**Problem:** VS Code hasn't registered the server

**Solutions:**
1. Check Developer Console: `Help` → `Toggle Developer Tools` → Console tab
2. Look for MCP-related errors
3. Verify `chat.agent.enabled` is `true` in settings
4. Restart VS Code completely (not just reload)

### "Could not determine GitHub repository"

**Problem:** Not in a git workspace or no GitHub remote

**Solutions:**
1. Verify git remote:
   ```bash
   git remote -v
   ```
2. Add remote if missing:
   ```bash
   git remote add origin https://github.com/owner/repo.git
   ```
3. Or specify owner/repo explicitly in commands

## Security Notes

⚠️ **Important:**

- User Settings JSON is stored in plaintext on your machine
- For maximum security:
  - Use the global config file approach (`~/.knowing-mcp.env`)
  - Set file permissions: `chmod 600 ~/.knowing-mcp.env`
  - Never commit this file to git
  - Rotate tokens regularly

- Consider using environment variables instead:
  ```bash
  # In ~/.zshrc or ~/.bashrc
  export GH_TOKEN="ghp_your_token"
  export AZURE_OPENAI_API_KEY="your_key"
  export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
  ```

## Next Steps

Once configured:

1. ✅ Open any workspace with a GitHub remote
2. ✅ Use Copilot Chat naturally:
   - "List all bugs"
   - "Create issue titled 'Fix header layout'"
   - "Show issue #42"
   - "What's our circuit breaker strategy?" (if .vscode/docs/ARCHITECTURE.md exists)
3. ✅ No need to specify owner/repo - automatically detected!

---

**Questions?** See main README.md or create an issue.
