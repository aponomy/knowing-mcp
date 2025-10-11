# knowing-mcp# knowing-mcp



[![npm version](https://badge.fury.io/js/knowing-mcp.svg)](https://www.npmjs.com/package/knowing-mcp)**Workspace-aware MCP (Model Context Protocol) server** that works in any VS Code project. Automatically detects the GitHub repository from your workspace's git remote and provides GitHub operations, expert AI assistance, and architecture documentation tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Node.js CI](https://github.com/Gullers-Grupp/knowing-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Gullers-Grupp/knowing-mcp/actions/workflows/ci.yml)## 🎯 Key Features



**Workspace-aware MCP server** for GitHub operations and AI assistance that works in any VS Code project. Automatically detects your repository, so you never need to specify owner/repo again!- ✅ **Workspace-aware**: Automatically detects GitHub repo from git remote

- ✅ **Global credentials**: Store GitHub token and Azure keys once, use everywhere

<p align="center">- ✅ **Works in any project**: Register once, available in all VS Code workspaces

  <img src="https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue" alt="MCP"/>- ✅ **No hardcoding**: No need to specify owner/repo for each operation

  <img src="https://img.shields.io/badge/GitHub-Copilot-green" alt="GitHub Copilot"/>- ✅ **Full tool suite**: GitHub issues, projects, ask-expert, ask-architect

  <img src="https://img.shields.io/badge/Azure-OpenAI-orange" alt="Azure OpenAI"/>

</p>## 🚀 Quick Start



## ✨ Features### 1. Install Dependencies



- 🎯 **Auto-detects GitHub repository** from git remote - no more typing owner/repo!```bash

- 🌍 **Works in any VS Code workspace** - configure once, use everywherecd tools/knowing-mcp

- 🔐 **Global credentials** - GitHub token and Azure keys stored securelynpm install

- 🛠️ **11 GitHub tools** - Full issue and project management```

- 🤖 **2 AI tools** - Expert consultation (GPT-5) and architecture Q&A

- 📚 **Zero configuration per-project** - Just open and use!### 2. Configure Global Credentials



## 🚀 Quick Start**Option A: VS Code User Settings (Recommended)**



### InstallEdit your VS Code **User Settings** (JSON):

- Press `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"

```bash- Add the MCP server configuration:

npm install -g knowing-mcp

``````json

{

### Configure  "github.copilot.chat.mcpServers": {

    "knowing-mcp": {

Add to VS Code **User Settings** (JSON):      "command": "node",

      "args": ["/Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs"],

```json      "env": {

{        "WORKSPACE_ROOT": "${workspaceFolder}",

  "github.copilot.chat.mcpServers": {        "GH_TOKEN": "YOUR_GITHUB_TOKEN",

    "knowing-mcp": {        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",

      "command": "knowing-mcp",        "AZURE_OPENAI_API_KEY": "YOUR_AZURE_KEY",

      "env": {        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"

        "WORKSPACE_ROOT": "${workspaceFolder}",      }

        "GH_TOKEN": "ghp_your_github_token"    }

      }  }

    }}

  }```

}

```**Option B: Global Config File**



### UseCreate `~/.knowing-mcp.env`:



Open **any** workspace with a GitHub remote, then in Copilot Chat:```bash

# GitHub Personal Access Token

```GH_TOKEN=ghp_your_token_here

List all open issues

Create issue titled "Fix header layout"# Azure OpenAI Configuration

Show me issue #42AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

```AZURE_OPENAI_API_KEY=your_key_here

AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-5

**No need to specify owner/repo - automatically detected!** ✨```



## 📖 Documentation**Getting your tokens:**



- **[Installation Guide](INSTALL.md)** - Complete installation instructions- **GitHub Token**: https://github.com/settings/tokens/new

- **[Quick Start](QUICK-START.md)** - Get running in 5 minutes  - Scopes needed: `repo`, `project`, `read:org`

- **[VS Code Setup](VSCODE-SETUP.md)** - Detailed configuration- **Azure OpenAI**: From Azure Portal → Your OpenAI resource → Keys and Endpoint

- **[Contributing](CONTRIBUTING.md)** - How to contribute

### 3. Update the Server Path

## 🎯 What Makes It Special?

In the VS Code User Settings above, replace:

### Before (traditional MCP):```

```/Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs

Create issue in owner/repo with title "Bug fix"  ← Manual every time```

```

With the actual absolute path to `server.mjs` on your machine.

### After (knowing-mcp):

```**Find your path:**

Create issue titled "Bug fix"  ← Auto-detects your repo! 🎉```bash

```cd tools/knowing-mcp

pwd

### Cross-Workspace:# Copy the output and append "/server.mjs"

``````

# In workspace A (Gullers-Grupp/platform)

"List issues" → Shows issues from Gullers-Grupp/platform### 4. Reload VS Code



# In workspace B (microsoft/vscode)  - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)

"List issues" → Shows issues from microsoft/vscode- Run: **"Developer: Reload Window"**



Same command, different repo. Automatic! ✨### 5. Test in Any Workspace

```

Open **any** VS Code workspace that has a GitHub remote, then in Copilot Chat:

## 🛠️ Available Tools

```

### GitHub Tools (Auto-detects repo)@workspace List all open issues

```

| Tool | Description | Required Params |

|------|-------------|-----------------|The MCP will automatically detect your repository and list issues!

| `issue-create` | Create an issue | `title` |

| `issue-list` | List issues | none |## 📚 Available Tools

| `issue-get` | Get issue details | `issue_number` |

| `issue-comment` | Add comment | `issue_number`, `body` |### GitHub Tools (Auto-detect repo from workspace)

| `issue-update` | Update issue | `issue_number` |

| `issue-close` | Close issue | `issue_number` |#### `issue-create`

| `project-get` | Get project info | `owner`, `number` |Create a GitHub issue. No need to specify owner/repo.

| `project-item-add` | Add to project | `projectId`, `contentId` |

| `project-draft-issue` | Create draft | `projectId`, `title` |```typescript

{

### AI Tools  title: string;           // Required

  body?: string;

| Tool | Description |  labels?: string[];

|------|-------------|  owner?: string;          // Optional: auto-detected

| `ask-expert` | Ask Azure OpenAI GPT-5 complex questions |  repo?: string;           // Optional: auto-detected

| `ask-architect` | Query architecture docs (.vscode/docs/ARCHITECTURE.md) |}

```

## 💡 Examples

**Example in Copilot:**

### Issue Management```

Create an issue titled "Fix login bug" with label "bug"

``````

# List issues (auto-detects current repo)

"List all open issues"#### `issue-list`

"Show me closed bugs"List issues in the current workspace's repository.



# Create issues```typescript

"Create issue titled 'Fix login bug' with label 'bug'"{

  state?: "open" | "closed" | "all";  // Default: "open"

# Get details  limit?: number;                      // Default: 20

"Show me issue #42"  owner?: string;                      // Optional: auto-detected

"What's the status of issue #123?"  repo?: string;                       // Optional: auto-detected

}

# Update```

"Add comment to issue #42: 'Working on this'"

"Close issue #42 with comment 'Fixed in PR #43'"**Example:**

``````

Show me all open issues

### AI Assistance```



```#### `issue-get`

# Expert consultation (requires Azure OpenAI)Get details of a specific issue.

"I need expert help with this TypeScript issue.

Question: How do I solve [problem]?```typescript

Context: [full details]"{

  issue_number: number;    // Required

# Architecture questions (requires .vscode/docs/ARCHITECTURE.md)  owner?: string;          // Optional: auto-detected

"What's our circuit breaker strategy?"  repo?: string;           // Optional: auto-detected

"How do we handle Dataverse outages?"}

``````



## 🔧 How It Works**Example:**

```

1. **Workspace Detection**: Reads `WORKSPACE_ROOT` environment variableShow me issue #42

2. **Git Remote Parsing**: Runs `git config --get remote.origin.url````

3. **URL Parsing**: Extracts owner and repo from GitHub URL

4. **Caching**: Caches repo info per workspace for performance#### `issue-comment`

5. **Tool Execution**: Uses detected repo or allows overrideAdd a comment to an issue.



**Supports:**```typescript

- ✅ HTTPS: `https://github.com/owner/repo.git`{

- ✅ SSH: `git@github.com:owner/repo.git`  issue_number: number;    // Required

  body: string;            // Required

## 📦 Installation Methods  owner?: string;          // Optional: auto-detected

  repo?: string;           // Optional: auto-detected

### 1. NPM (Recommended)}

```bash```

npm install -g knowing-mcp

```**Example:**

```

### 2. From SourceComment on issue #42: "This is fixed in the latest commit"

```bash```

git clone https://github.com/Gullers-Grupp/knowing-mcp.git

cd knowing-mcp#### `issue-update`

npm installUpdate an issue's title, body, labels, or state.

npm link

``````typescript

{

### 3. Manual  issue_number: number;    // Required

```bash  title?: string;

git clone https://github.com/Gullers-Grupp/knowing-mcp.git  body?: string;

cd knowing-mcp  state?: "open" | "closed";

npm install  labels?: string[];

# Use full path in VS Code settings  owner?: string;          // Optional: auto-detected

```  repo?: string;           // Optional: auto-detected

}

See [INSTALL.md](INSTALL.md) for detailed instructions.```



## 🔐 Credentials**Example:**

```

Three options for storing credentials:Update issue #42 to add label "critical"

```

### Option 1: VS Code User Settings (Quick)

```json#### `issue-close`

{Close an issue with an optional comment.

  "github.copilot.chat.mcpServers": {

    "knowing-mcp": {```typescript

      "env": {{

        "GH_TOKEN": "ghp_...",  issue_number: number;    // Required

        "AZURE_OPENAI_API_KEY": "..."  comment?: string;

      }  owner?: string;          // Optional: auto-detected

    }  repo?: string;           // Optional: auto-detected

  }}

}```

```

**Example:**

### Option 2: Global Config File (Secure)```

```bashClose issue #42 with comment "Fixed in PR #43"

# Create ~/.knowing-mcp.env```

GH_TOKEN=ghp_...

AZURE_OPENAI_ENDPOINT=https://...### Project Tools

AZURE_OPENAI_API_KEY=...

#### `project-get`

# Secure itGet GitHub Project information.

chmod 600 ~/.knowing-mcp.env

``````typescript

{

### Option 3: Environment Variables (Most Secure)  owner: string;           // Required

```bash  number: number;          // Project number

# Add to ~/.zshrc or ~/.bashrc}

export GH_TOKEN="ghp_..."```

export AZURE_OPENAI_API_KEY="..."

```#### `project-item-add`

Add an issue/PR to a GitHub Project (v2).

## 🧪 Testing

```typescript

```bash{

# Run test suite  projectId: string;       // Project Node ID

npm test  contentId: string;       // Issue/PR Node ID

}

# Expected output:```

# ✅ Detected GitHub repo: owner/repo

# ✅ Found .git directory#### `project-draft-issue`

# ✅ server.mjs foundCreate a draft issue directly in a project.

# ✅ All checks passed!

``````typescript

{

## 🤝 Contributing  projectId: string;       // Project Node ID

  title: string;

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).  body?: string;

}

## 📄 License```



[MIT](LICENSE) © Gullers Grupp### AI Tools



## 🙏 Acknowledgments#### `ask-expert`

Ask complex technical questions to Azure OpenAI GPT-5 (o3-pro).

- Built on [Model Context Protocol](https://github.com/modelcontextprotocol) by Anthropic

- Uses [@octokit/rest](https://github.com/octokit/rest.js) for GitHub API**🚨 CRITICAL**: The expert has NO chat history. Provide COMPLETE context every time.

- Supports [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

```typescript

## 🐛 Issues & Support{

  question: string;        // Required: Your technical question

- **Bug Reports**: [GitHub Issues](https://github.com/Gullers-Grupp/knowing-mcp/issues)  context: string;         // Required: Full context (errors, code, what you tried)

- **Feature Requests**: [GitHub Issues](https://github.com/Gullers-Grupp/knowing-mcp/issues)  reasoning_effort?: "low" | "medium" | "high";  // Default: "medium"

- **Discussions**: [GitHub Discussions](https://github.com/Gullers-Grupp/knowing-mcp/discussions)}

```

## ⭐ Star History

**Example:**

If you find this useful, please star the repo! ⭐```

I'm stuck on a complex TypeScript type inference issue.

---

Question: How do I make this generic type work?

**Made with ❤️ for developers who work across multiple projects**

Context: 
- Using TypeScript 5.0
- Code: [paste code here]
- Error: [paste error here]
- What I tried: [describe attempts]
```

#### `ask-architect`
Answer architecture questions using the workspace's `.vscode/docs/ARCHITECTURE.md`.

```typescript
{
  question: string;        // Required
}
```

**Example:**
```
What happens if Dataverse goes down?
```

The tool will:
1. Read `.vscode/docs/ARCHITECTURE.md` from current workspace
2. Send to Azure OpenAI for analysis (off Copilot's context)
3. Return answer with citations (section + line numbers)
4. Propose documentation edits if gaps are found

## 🔧 How It Works

### Automatic Repository Detection

The MCP server detects your GitHub repository by:

1. Reading `WORKSPACE_ROOT` environment variable (set by VS Code)
2. Checking if workspace has a `.git` directory
3. Running `git config --get remote.origin.url`
4. Parsing the URL to extract owner and repo

**Supported URL formats:**
- HTTPS: `https://github.com/owner/repo.git`
- SSH: `git@github.com:owner/repo.git`

### Credential Resolution

The server looks for credentials in this order:

1. **VS Code environment variables** (from User Settings `env` block)
2. **Global config file** (`~/.knowing-mcp.env`)
3. **Process environment** (system env vars)

This allows you to:
- Set credentials once in VS Code User Settings
- Use the MCP in any workspace
- Never commit credentials to repositories

### Workspace vs Global

**Workspace-scoped MCP** (old approach):
```json
// .vscode/settings.json (per workspace)
{
  "github.copilot.chat.mcpServers": {
    "mcp-gullers-dev": {
      "command": "node",
      "args": ["./tools/mcp-gullers-dev/server.mjs"]
    }
  }
}
```

**Global MCP** (knowing-mcp):
```json
// User Settings (all workspaces)
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/knowing-mcp/server.mjs"],
      "env": { "WORKSPACE_ROOT": "${workspaceFolder}" }
    }
  }
}
```

## 🆚 Differences from mcp-gullers-dev

| Feature | mcp-gullers-dev | knowing-mcp |
|---------|----------------|-------------|
| **Scope** | Single workspace | All workspaces |
| **Repo detection** | Manual (must specify owner/repo) | Automatic (from git remote) |
| **Credentials** | Workspace `.env` file | Global (VS Code User Settings or `~/.knowing-mcp.env`) |
| **Registration** | Workspace settings | User settings |
| **Path** | Relative (`./tools/...`) | Absolute |
| **Usage** | Only in gullers-platform | Any GitHub project |

## 🧪 Testing

### Test in Current Workspace

```bash
node test-connection.mjs
```

### Test Manual Operation

```javascript
import { execSync } from 'child_process';

// Test git detection
const remoteUrl = execSync('git config --get remote.origin.url', {
  encoding: 'utf8'
}).trim();

console.log('Remote URL:', remoteUrl);

// Expected output:
// Remote URL: git@github.com:Gullers-Grupp/platform.git
// or
// Remote URL: https://github.com/Gullers-Grupp/platform.git
```

## 🐛 Troubleshooting

### "Could not determine GitHub repository"

**Cause**: Not in a git repository or no GitHub remote configured.

**Solutions:**
1. Ensure workspace has a `.git` directory:
   ```bash
   git status
   ```

2. Check git remote:
   ```bash
   git remote -v
   ```

3. Add GitHub remote if missing:
   ```bash
   git remote add origin https://github.com/owner/repo.git
   ```

4. Or specify `owner` and `repo` explicitly:
   ```
   Create an issue in owner/repo with title "Bug fix"
   ```

### "Missing environment variable: GH_TOKEN"

**Cause**: Credentials not configured.

**Solution**: Add credentials to VS Code User Settings or create `~/.knowing-mcp.env` (see Setup above).

### MCP not showing in Copilot

**Causes:**
1. VS Code not reloaded after config change
2. Wrong server path in User Settings
3. Node.js not in PATH

**Solutions:**
1. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"
2. Verify absolute path in User Settings
3. Test server manually:
   ```bash
   node /path/to/knowing-mcp/server.mjs
   ```

### "Architecture document not found"

**Cause**: Workspace doesn't have `.vscode/docs/ARCHITECTURE.md`.

**Solution**: 
- Create the file in your workspace
- Or use a different workspace that has architecture docs
- The `ask-architect` tool only works in workspaces with this file

## 📖 Example Workflows

### Bug Tracking Workflow

```
# In Copilot Chat (any workspace with GitHub remote)

1. "List all open bugs"
   → Shows issues with 'bug' label

2. "Create issue: Login fails on Safari with title 'Safari login bug' and label 'bug'"
   → Creates issue in current repo

3. "Add comment to issue #42: Reproduced on Safari 17.2"
   → Adds your comment

4. "Close issue #42 with comment 'Fixed in PR #43'"
   → Closes issue with comment
```

### Architecture Research Workflow

```
# In workspace with .vscode/docs/ARCHITECTURE.md

1. "What's our circuit breaker strategy?"
   → ask-architect reads docs and answers with citations

2. "How do we handle Dataverse outages?"
   → Answers from architecture doc

3. If gaps found:
   → Tool proposes documentation updates
   → Review diffs in chat
   → Apply edits to improve docs
```

### Expert Consultation Workflow

```
# Complex TypeScript problem

"I need expert help with this TypeScript issue.

Question: How do I infer return types for this generic builder pattern?

Context:
- TypeScript 5.0
- Builder pattern with fluent API
- Current error: [paste full error]
- Code snippet: [paste code]
- What I tried: [describe 3 failed attempts]

Use high reasoning effort."

→ Gets deep analysis from GPT-5 with extended thinking
```

## 🔐 Security Best Practices

1. **Never commit credentials** to git repositories
2. **Use Personal Access Tokens** with minimal scopes:
   - `repo` (for private repos)
   - `public_repo` (for public repos only)
   - `project` (for GitHub Projects)
3. **Rotate tokens** regularly
4. **Use `.knowing-mcp.env`** with restricted permissions:
   ```bash
   chmod 600 ~/.knowing-mcp.env
   ```
5. **Consider VS Code Secret Storage** for production use (requires extension development)

## 🤝 Contributing

This MCP server is part of the Gullers Platform but designed to be generally useful.

**To extend:**
1. Add new tools to `TOOLS` array in `server.mjs`
2. Add tool handler in `switch` statement
3. Update README with examples
4. Test in multiple workspaces

## 📄 License

Part of the Gullers Platform - private use only.

## 🆘 Support

For issues:
1. Check troubleshooting section above
2. Test with `node test-connection.mjs`
3. Check VS Code Developer Console: `Help` → `Toggle Developer Tools`
4. Create issue in gullers-platform repository

---

**Built with ❤️ for developers who work across multiple projects**
