# knowing-mcp# knowing-mcp# knowing-mcp



[![npm version](https://badge.fury.io/js/knowing-mcp.svg)](https://www.npmjs.com/package/knowing-mcp)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![npm version](https://badge.fury.io/js/knowing-mcp.svg)](https://www.npmjs.com/package/knowing-mcp)**Workspace-aware MCP (Model Context Protocol) server** that works in any VS Code project. Automatically detects the GitHub repository from your workspace's git remote and provides GitHub operations, expert AI assistance, and architecture documentation tools.

**Global MCP (Model Context Protocol) server** for GitHub operations and AI assistance. Configure once in VS Code, use in any workspace with any repository.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">

  <img src="https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue" alt="MCP"/>[![Node.js CI](https://github.com/Gullers-Grupp/knowing-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Gullers-Grupp/knowing-mcp/actions/workflows/ci.yml)## 🎯 Key Features

  <img src="https://img.shields.io/badge/GitHub-Copilot-green" alt="GitHub Copilot"/>

  <img src="https://img.shields.io/badge/Azure-OpenAI-orange" alt="Azure OpenAI"/>

</p>

**Workspace-aware MCP server** for GitHub operations and AI assistance that works in any VS Code project. Automatically detects your repository, so you never need to specify owner/repo again!- ✅ **Workspace-aware**: Automatically detects GitHub repo from git remote

## ✨ Features

- ✅ **Global credentials**: Store GitHub token and Azure keys once, use everywhere

- 🌍 **Works in any VS Code workspace** - configure once, use everywhere

- 🔐 **Global credentials** - GitHub token and Azure keys stored securely<p align="center">- ✅ **Works in any project**: Register once, available in all VS Code workspaces

- 🛠️ **11 GitHub tools** - Full issue and project management

- 🤖 **2 AI tools** - Expert consultation (Azure OpenAI GPT-5) and architecture Q&A  <img src="https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue" alt="MCP"/>- ✅ **No hardcoding**: No need to specify owner/repo for each operation

- 📚 **Simple setup** - Configure mcp.json and reload

  <img src="https://img.shields.io/badge/GitHub-Copilot-green" alt="GitHub Copilot"/>- ✅ **Full tool suite**: GitHub issues, projects, ask-expert, ask-architect

## 🚀 Quick Start

  <img src="https://img.shields.io/badge/Azure-OpenAI-orange" alt="Azure OpenAI"/>

### 1. Install Dependencies

</p>## 🚀 Quick Start

```bash

cd ~/Github  # or your preferred location

git clone https://github.com/aponomy/knowing-mcp.git

cd knowing-mcp## ✨ Features### 1. Install Dependencies

npm install

```



### 2. Configure Credentials- 🎯 **Auto-detects GitHub repository** from git remote - no more typing owner/repo!```bash



Create `~/.knowing-mcp.env`:- 🌍 **Works in any VS Code workspace** - configure once, use everywherecd tools/knowing-mcp



```bash- 🔐 **Global credentials** - GitHub token and Azure keys stored securelynpm install

# GitHub Personal Access Token

GH_TOKEN=ghp_your_token_here- 🛠️ **11 GitHub tools** - Full issue and project management```



# Azure OpenAI Configuration (optional)- 🤖 **2 AI tools** - Expert consultation (GPT-5) and architecture Q&A

AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

AZURE_OPENAI_API_KEY=your_key_here- 📚 **Zero configuration per-project** - Just open and use!### 2. Configure Global Credentials

AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-4o-realtime

```



**Get your tokens:**## 🚀 Quick Start**Option A: VS Code User Settings (Recommended)**

- **GitHub**: https://github.com/settings/tokens/new (scopes: `repo`, `project`, `read:org`)

- **Azure OpenAI**: Azure Portal → Your OpenAI resource → Keys and Endpoint



### 3. Configure VS Code MCP### InstallEdit your VS Code **User Settings** (JSON):



> **Important**: MCP servers are configured in `mcp.json`, NOT in `settings.json`- Press `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"



Create or edit: `~/Library/Application Support/Code/User/mcp.json````bash- Add the MCP server configuration:



```jsonnpm install -g knowing-mcp

{

  "servers": {``````json

    "knowing-mcp": {

      "command": "node",{

      "args": ["/Users/YOUR_USERNAME/Github/knowing-mcp/src/server.mjs"],

      "env": {### Configure  "github.copilot.chat.mcpServers": {

        "GH_TOKEN": "${input:gh-token}",

        "AZURE_OPENAI_ENDPOINT": "${input:azure-endpoint}",    "knowing-mcp": {

        "AZURE_OPENAI_API_KEY": "${input:azure-key}",

        "AZURE_OPENAI_GPT5_DEPLOYMENT": "${input:azure-deployment}"Add to VS Code **User Settings** (JSON):      "command": "node",

      }

    }      "args": ["/Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs"],

  },

  "inputs": {```json      "env": {

    "gh-token": "ghp_your_actual_token",

    "azure-endpoint": "https://your-resource.openai.azure.com",{        "WORKSPACE_ROOT": "${workspaceFolder}",

    "azure-key": "your_azure_key",

    "azure-deployment": "gpt-4o-realtime"  "github.copilot.chat.mcpServers": {        "GH_TOKEN": "YOUR_GITHUB_TOKEN",

  }

}    "knowing-mcp": {        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",

```

      "command": "knowing-mcp",        "AZURE_OPENAI_API_KEY": "YOUR_AZURE_KEY",

**Replace**: 

- `/Users/YOUR_USERNAME/...` with the actual absolute path to your `server.mjs`      "env": {        "AZURE_OPENAI_GPT5_DEPLOYMENT": "gpt-5"

- All credential values with your actual tokens

        "WORKSPACE_ROOT": "${workspaceFolder}",      }

### 4. Reload VS Code

        "GH_TOKEN": "ghp_your_github_token"    }

Press `Cmd+Shift+P` → **"Developer: Reload Window"**

      }  }

### 5. Test It

    }}

In Copilot Chat, try:

  }```

```

List issues in aponomy/knowing-mcp}

```

```**Option B: Global Config File**

The agent should automatically call the `issue-list` tool with the specified repository.



## 📚 Available Tools

### UseCreate `~/.knowing-mcp.env`:

### GitHub Tools (require owner/repo)



| Tool | Description | Required Parameters |

|------|-------------|---------------------|Open **any** workspace with a GitHub remote, then in Copilot Chat:```bash

| `issue-list` | List issues | `owner`, `repo` |

| `issue-create` | Create an issue | `owner`, `repo`, `title` |# GitHub Personal Access Token

| `issue-get` | Get issue details | `owner`, `repo`, `issue_number` |

| `issue-update` | Update an issue | `owner`, `repo`, `issue_number` |```GH_TOKEN=ghp_your_token_here

| `issue-close` | Close an issue | `owner`, `repo`, `issue_number` |

| `issue-comment` | Comment on issue | `owner`, `repo`, `issue_number`, `body` |List all open issues



### Project ToolsCreate issue titled "Fix header layout"# Azure OpenAI Configuration



| Tool | Description | Required Parameters |Show me issue #42AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

|------|-------------|---------------------|

| `project-get` | Get project info | `owner`, `number` |```AZURE_OPENAI_API_KEY=your_key_here

| `project-item-add` | Add item to project | `projectId`, `contentId` |

| `project-draft-issue` | Create draft issue | `projectId`, `title` |AZURE_OPENAI_GPT5_DEPLOYMENT=gpt-5



### AI Tools (no repo needed)**No need to specify owner/repo - automatically detected!** ✨```



| Tool | Description | Required Parameters |

|------|-------------|---------------------|

| `ask-expert` | Ask Azure OpenAI GPT-5 | `question`, `context` |## 📖 Documentation**Getting your tokens:**

| `ask-architect` | Query architecture docs | `question` |



## 🎯 Usage Examples

- **[Installation Guide](docs/docs/INSTALL.md)** - Complete installation instructions- **GitHub Token**: https://github.com/settings/tokens/new

### Natural Language Commands

- **[Quick Start](QUICK-START.md)** - Get running in 5 minutes  - Scopes needed: `repo`, `project`, `read:org`

The agent intelligently extracts owner/repo from your commands:

- **[VS Code Setup](docs/VSCODE-SETUP.md)** - Detailed configuration- **Azure OpenAI**: From Azure Portal → Your OpenAI resource → Keys and Endpoint

```

"List issues in aponomy/knowing-mcp"- **[Contributing](CONTRIBUTING.md)** - How to contribute

"Create an issue in microsoft/vscode titled 'Bug fix'"

"Show me issue #42 in facebook/react"### 3. Update the Server Path

```

## 🎯 What Makes It Special?

### Working Across Repositories

In the VS Code User Settings above, replace:

You can work with different repos in the same session:

### Before (traditional MCP):```

```

"List issues in aponomy/knowing-mcp"```/Users/YOUR_USERNAME/Github/gullers-platform/tools/knowing-mcp/server.mjs

"Now show issues in microsoft/vscode"

"Create an issue in facebook/react titled 'Documentation update'"Create issue in owner/repo with title "Bug fix"  ← Manual every time```

```

```

### Using AI Tools

With the actual absolute path to `server.mjs` on your machine.

```

"Ask expert: Why is my React component re-rendering unnecessarily?"### After (knowing-mcp):

"Ask architect: How should we structure our microservices?"

``````**Find your path:**



## 🔧 Why owner/repo are RequiredCreate issue titled "Bug fix"  ← Auto-detects your repo! 🎉```bash



Global MCP servers cannot automatically detect which workspace VS Code is currently using because:```cd tools/knowing-mcp



- ❌ MCP protocol doesn't define "workspace" conceptpwd

- ❌ VS Code doesn't pass workspace context to global servers  

- ❌ `process.cwd()` is the user's home directory, not the workspace### Cross-Workspace:# Copy the output and append "/server.mjs"

- ❌ `${workspaceFolder}` variables don't work in global `mcp.json`

``````

Making `owner` and `repo` **required** ensures:

# In workspace A (Gullers-Grupp/platform)

- ✅ Clear, explicit operations

- ✅ Works in any workspace"List issues" → Shows issues from Gullers-Grupp/platform### 4. Reload VS Code

- ✅ No silent failures or confusing errors

- ✅ Agent can intelligently extract from conversation context



## 📖 Documentation# In workspace B (microsoft/vscode)  - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)



- **[Deployment Guide](docs/docs/DEPLOYMENT.md)** - Complete deployment instructions"List issues" → Shows issues from microsoft/vscode- Run: **"Developer: Reload Window"**

- **[Installation Guide](docs/docs/INSTALL.md)** - Detailed installation steps

- **[Quick Start](QUICK-START.md)** - Get running in 5 minutes

- **[Contributing](CONTRIBUTING.md)** - How to contribute

- **[Security](SECURITY.md)** - Security best practicesSame command, different repo. Automatic! ✨### 5. Test in Any Workspace



## 🔧 Troubleshooting```



### Server Not StartingOpen **any** VS Code workspace that has a GitHub remote, then in Copilot Chat:



1. Check `mcp.json` syntax (must be valid JSON)## 🛠️ Available Tools

2. Verify server path is absolute and correct

3. Ensure Node.js v18+ is installed (`node --version`)```

4. Check VS Code Developer Console for errors

### GitHub Tools (Auto-detects repo)@workspace List all open issues

### Tools Not Appearing

```

1. Verify server is running (Developer Console: "Connection state: Running")

2. Check for "Discovered 11 tools" message| Tool | Description | Required Params |

3. Reload window: `Cmd+Shift+P` → "Developer: Reload Window"

4. Ensure tools are enabled per-agent/chat session|------|-------------|-----------------|The MCP will automatically detect your repository and list issues!



### Authentication Errors| `issue-create` | Create an issue | `title` |



1. Verify GitHub token scopes: `repo`, `project`, `read:org`| `issue-list` | List issues | none |## 📚 Available Tools

2. Check credentials in `mcp.json` are correct

3. Test token at https://github.com/settings/tokens| `issue-get` | Get issue details | `issue_number` |

4. Verify Azure credentials in Azure Portal

| `issue-comment` | Add comment | `issue_number`, `body` |### GitHub Tools (Auto-detect repo from workspace)

## 🎓 Configuration Notes

| `issue-update` | Update issue | `issue_number` |

### Key Differences from Initial Design

| `issue-close` | Close issue | `issue_number` |#### `issue-create`

| Aspect | Initial Design | Actual Implementation |

|--------|---------------|----------------------|| `project-get` | Get project info | `owner`, `number` |Create a GitHub issue. No need to specify owner/repo.

| **Config file** | `settings.json` | `mcp.json` |

| **Location** | `github.copilot.chat.mcpServers` | `servers` in mcp.json || `project-item-add` | Add to project | `projectId`, `contentId` |

| **Workspace vars** | `${workspaceFolder}` supported | Only in workspace configs |

| **Repo detection** | Automatic from workspace | Explicit owner/repo required || `project-draft-issue` | Create draft | `projectId`, `title` |```typescript

| **Credentials** | Direct in `env` | Uses `inputs` pattern |

{

### Where to Configure

### AI Tools  title: string;           // Required

- **Global**: `~/Library/Application Support/Code/User/mcp.json`

  - Available in all workspaces  body?: string;

  - Cannot use `${workspaceFolder}` variables

  - Must specify owner/repo explicitly| Tool | Description |  labels?: string[];



- **Workspace**: `.vscode/mcp.json` (optional)|------|-------------|  owner?: string;          // Optional: auto-detected

  - Workspace-specific configuration

  - Can use `${workspaceFolder}` variables| `ask-expert` | Ask Azure OpenAI GPT-5 complex questions |  repo?: string;           // Optional: auto-detected

  - Overrides global config

| `ask-architect` | Query architecture docs (.vscode/docs/ARCHITECTURE.md) |}

## 🤝 Contributing

```

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 💡 Examples

## 📝 License

**Example in Copilot:**

MIT License - see [LICENSE](LICENSE) for details.

### Issue Management```

## 🆘 Support

Create an issue titled "Fix login bug" with label "bug"

- **Issues**: https://github.com/aponomy/knowing-mcp/issues

- **Discussions**: https://github.com/aponomy/knowing-mcp/discussions``````

- **Documentation**: Full docs in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

# List issues (auto-detects current repo)

## 🔄 Updating

"List all open issues"#### `issue-list`

To update to the latest version:

"Show me closed bugs"List issues in the current workspace's repository.

```bash

cd ~/Github/knowing-mcp

git pull origin main

npm install# Create issues```typescript

# Reload VS Code: Cmd+Shift+P → "Developer: Reload Window"

```"Create issue titled 'Fix login bug' with label 'bug'"{



## 🌟 Star History  state?: "open" | "closed" | "all";  // Default: "open"



If you find this useful, please star the repo! ⭐# Get details  limit?: number;                      // Default: 20



---"Show me issue #42"  owner?: string;                      // Optional: auto-detected



**Built with** [Model Context Protocol](https://modelcontextprotocol.io/) | **Powered by** [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)"What's the status of issue #123?"  repo?: string;                       // Optional: auto-detected


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

See [docs/INSTALL.md](docs/INSTALL.md) for detailed instructions.```



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
