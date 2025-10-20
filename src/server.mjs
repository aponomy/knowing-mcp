#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import fetch from "node-fetch";
import OpenAI from "openai";
import { join } from 'path';
import { closeBrowser } from './browser-manager.mjs';
import { PLAYWRIGHT_TOOLS, handlePlaywrightTool } from './playwright-tools.mjs';

// Initialize clients lazily to allow environment variables to be set by VS Code
let octokit = null;
let openai = null;

function initializeClients() {
  if (!octokit) {
    const GH_TOKEN = getEnv("GH_TOKEN");
    octokit = new Octokit({ auth: GH_TOKEN });
  }
  
  if (!openai) {
    const OPENAI_API_KEY = getEnv("AZURE_OPENAI_API_KEY");
    const OPENAI_ENDPOINT = getEnv("AZURE_OPENAI_ENDPOINT");
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: `${OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments`,
      defaultQuery: { 'api-version': '2024-12-01-preview' }, // Updated for o3 support
      defaultHeaders: { 'api-key': OPENAI_API_KEY }
    });
  }
}

/**
 * Get environment variable from VS Code settings
 * Variables are passed via github.copilot.chat.mcpServers env configuration
 */
function getEnv(name, required = true) {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(
      `Missing environment variable: ${name}\n` +
      `Please set it in VS Code User Settings: github.copilot.chat.mcpServers.knowing-mcp.env.${name}`
    );
  }
  return value;
}

/**
 * Detect GitHub repository from workspace git remote
 * Returns { owner, repo } or null if not a git repo
 */
function detectGitHubRepo(workspacePath) {
  try {
    if (!workspacePath) {
      console.error('⚠️  No workspace path provided');
      return null;
    }

    // Check if .git exists
    const gitDir = join(workspacePath, '.git');
    if (!existsSync(gitDir)) {
      console.error('⚠️  Not a git repository:', workspacePath);
      return null;
    }

    // Get remote URL
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: workspacePath,
      encoding: 'utf8'
    }).trim();

    console.error('📍 Git remote URL:', remoteUrl);

    // Parse GitHub URL (supports both HTTPS and SSH)
    // HTTPS: https://github.com/owner/repo.git
    // SSH: git@github.com:owner/repo.git
    let match;
    
    if (remoteUrl.startsWith('https://')) {
      match = remoteUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    } else if (remoteUrl.startsWith('git@')) {
      match = remoteUrl.match(/github\.com:([^\/]+)\/([^\/\.]+)/);
    }

    if (match) {
      const [, owner, repo] = match;
      console.error(`✅ Detected GitHub repo: ${owner}/${repo}`);
      return { owner, repo };
    }

    console.error('⚠️  Could not parse GitHub URL:', remoteUrl);
    return null;
  } catch (error) {
    console.error('⚠️  Error detecting git repo:', error.message);
    return null;
  }
}

// Cache workspace repo info
let cachedWorkspaceRepo = null;
let cachedWorkspacePath = null;

function getWorkspaceRepo(workspacePath) {
  // Use cache if same workspace
  if (workspacePath === cachedWorkspacePath && cachedWorkspaceRepo) {
    return cachedWorkspaceRepo;
  }

  cachedWorkspacePath = workspacePath;
  cachedWorkspaceRepo = detectGitHubRepo(workspacePath);
  return cachedWorkspaceRepo;
}

// Create MCP server
const server = new Server(
  {
    name: "knowing-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the tools (owner/repo are required to ensure smooth operation)
const TOOLS = [
  {
    name: "issue-create",
    description: "Create an issue in a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        title: { type: "string", description: "Issue title" },
        body: { type: "string", description: "Issue body content" },
        labels: { 
          type: "array", 
          items: { type: "string" },
          description: "Labels to add to the issue"
        }
      },
      required: ["owner", "repo", "title"]
    }
  },
  {
    name: "issue-close",
    description: "Close an issue in a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number to close" },
        comment: { type: "string", description: "Optional comment when closing the issue" }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "issue-comment",
    description: "Add a comment to an existing GitHub issue.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number to comment on" },
        body: { type: "string", description: "Comment body content" }
      },
      required: ["owner", "repo", "issue_number", "body"]
    }
  },
  {
    name: "issue-update",
    description: "Update an existing GitHub issue (title, body, labels, state).",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number to update" },
        title: { type: "string", description: "New issue title" },
        body: { type: "string", description: "New issue body content" },
        state: { type: "string", enum: ["open", "closed"], description: "Issue state" },
        labels: { 
          type: "array", 
          items: { type: "string" },
          description: "Labels to set on the issue"
        }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "issue-get",
    description: "Get details of a specific GitHub issue.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number to retrieve" }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "issue-list",
    description: "List issues in a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", description: "Issue state: open, closed, or all", "enum": ["open", "closed", "all"] },
        limit: { type: "number", description: "Maximum number of issues to return (default: 20)" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "project-item-add",
    description: "Add an existing issue/PR to a GitHub Project (Projects v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Node ID for the Project" },
        contentId: { type: "string", description: "Node ID for issue/PR" }
      },
      required: ["projectId", "contentId"]
    }
  },
  {
    name: "project-draft-issue",
    description: "Create a draft issue directly in a GitHub Project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Node ID for the Project" },
        title: { type: "string", description: "Draft issue title" },
        body: { type: "string", description: "Draft issue body" }
      },
      required: ["projectId", "title"]
    }
  },
  {
    name: "project-get",
    description: "Get project information by owner and project number",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository/Organization owner" },
        number: { type: "number", description: "Project number" }
      },
      required: ["owner", "number"]
    }
  },
  {
    name: "ask-expert",
    description: "Ask an expert AI (Azure OpenAI GPT-5) a complex technical question. CRITICAL: Expert has NO chat history - you must provide COMPLETE context in EVERY call. Include all relevant details: problem summary, what you've tried, errors, code snippets, file structure. Use for deep technical analysis, architecture decisions, debugging complex issues.",
    inputSchema: {
      type: "object",
      properties: {
        question: { 
          type: "string", 
          description: "The technical question or problem to analyze. Be specific and comprehensive."
        },
        context: {
          type: "string",
          description: "REQUIRED: Complete background context - error messages, code snippets, file structure, what you've tried, relevant configuration. Expert has NO chat history!"
        },
        reasoning_effort: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Amount of reasoning effort to apply. 'low' = faster, 'medium' = balanced (default), 'high' = maximum thinking time and depth"
        }
      },
      required: ["question", "context"]
    }
  },
  {
    name: "ask-architect",
    description: "Answer architecture questions using a workspace's architecture document (.vscode/docs/ARCHITECTURE.md). Can propose updates when gaps are found.",
    inputSchema: {
      type: "object",
      properties: {
        question: { 
          type: "string", 
          description: "Architecture question to answer"
        },
        workspacePath: {
          type: "string",
          description: "Absolute path to the workspace directory (e.g., /Users/username/Github/my-project)"
        }
      },
      required: ["question", "workspacePath"]
    }
  },
  // Add Playwright browser automation tools
  ...PLAYWRIGHT_TOOLS
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Get workspace path from environment (needed for ask-architect tool)
  const workspacePath = process.env.WORKSPACE_ROOT || process.cwd();

  try {
    // Initialize clients with environment variables from VS Code
    initializeClients();
    
    // Handle Playwright browser automation tools
    if (name.startsWith('browser-')) {
      return await handlePlaywrightTool(name, args);
    }
    
    switch (name) {
      case "issue-create": {
        const { owner, repo } = args;
        const { title, body = "", labels = [] } = args;
        const { data } = await octokit.issues.create({ 
          owner, 
          repo, 
          title, 
          body,
          labels
        });
        return {
          content: [
            {
              type: "text",
              text: `✅ Created issue #${data.number}: ${data.title}\nURL: ${data.html_url}\nNode ID: ${data.node_id}`
            }
          ]
        };
      }

      case "issue-close": {
        const { owner, repo, issue_number, comment } = args;
        
        // Add comment if provided
        if (comment) {
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number,
            body: comment
          });
        }
        
        // Close the issue
        const { data } = await octokit.issues.update({
          owner,
          repo,
          issue_number,
          state: "closed"
        });
        
        return {
          content: [
            {
              type: "text",
              text: `✅ Closed issue #${data.number}: ${data.title}\n${comment ? `Comment added: ${comment}\n` : ''}URL: ${data.html_url}`
            }
          ]
        };
      }

      case "issue-comment": {
        const { owner, repo, issue_number, body } = args;
        const { data } = await octokit.issues.createComment({
          owner,
          repo,
          issue_number,
          body
        });
        
        return {
          content: [
            {
              type: "text",
              text: `✅ Comment added to issue #${issue_number}\nComment ID: ${data.id}\nURL: ${data.html_url}`
            }
          ]
        };
      }

      case "issue-update": {
        const { owner, repo, issue_number, title, body, state, labels } = args;
        
        // Build update object with only provided fields
        const updateData = { owner, repo, issue_number };
        if (title !== undefined) updateData.title = title;
        if (body !== undefined) updateData.body = body;
        if (state !== undefined) updateData.state = state;
        if (labels !== undefined) updateData.labels = labels;
        
        const { data } = await octokit.issues.update(updateData);
        
        return {
          content: [
            {
              type: "text",
              text: `✅ Updated issue #${data.number}: ${data.title}\nState: ${data.state}\nURL: ${data.html_url}`
            }
          ]
        };
      }

      case "issue-get": {
        const { owner, repo, issue_number } = args;
        const { data } = await octokit.issues.get({
          owner,
          repo,
          issue_number
        });
        
        const labels = data.labels.map(label => label.name).join(', ');
        const assignees = data.assignees?.map(assignee => assignee.login).join(', ') || 'None';
        
        return {
          content: [
            {
              type: "text",
              text: `📋 Issue #${data.number}: ${data.title}\n` +
                   `State: ${data.state}\n` +
                   `Author: ${data.user.login}\n` +
                   `Created: ${new Date(data.created_at).toLocaleString()}\n` +
                   `Updated: ${new Date(data.updated_at).toLocaleString()}\n` +
                   `Labels: ${labels || 'None'}\n` +
                   `Assignees: ${assignees}\n` +
                   `URL: ${data.html_url}\n\n` +
                   `Body:\n${data.body || 'No description'}`
            }
          ]
        };
      }

      case "issue-list": {
        const { owner, repo, state = "open", limit = 20 } = args;
        const { data } = await octokit.issues.listForRepo({
          owner,
          repo,
          state,
          per_page: limit,
          sort: "created",
          direction: "desc"
        });
        
        // Filter out pull requests and ensure we only get issues from this specific repo
        const issuesOnly = data.filter(issue => 
          !issue.pull_request && 
          issue.repository_url === `https://api.github.com/repos/${owner}/${repo}`
        );
        
        // Sort by issue number for better readability
        issuesOnly.sort((a, b) => b.number - a.number);
        
        const issueList = issuesOnly.map(issue => 
          `#${issue.number}: ${issue.title} [${issue.state}]${issue.labels.length > 0 ? ` (${issue.labels.map(l => l.name).join(', ')})` : ''}`
        ).join('\n');
        
        return {
          content: [
            {
              type: "text",
              text: `📋 Issues in ${owner}/${repo} (${state}):\n\n${issueList || 'No issues found'}`
            }
          ]
        };
      }

      case "project-item-add": {
        const { projectId, contentId } = args;
        const mutation = `mutation($projectId:ID!, $contentId:ID!){
          addProjectV2ItemById(input:{projectId:$projectId, contentId:$contentId}){ 
            item { id } 
          }
        }`;
        const { data } = await octokit.graphql(mutation, { projectId, contentId });
        return {
          content: [
            {
              type: "text", 
              text: `✅ Added item to project\nProject Item ID: ${data.addProjectV2ItemById.item.id}`
            }
          ]
        };
      }

      case "project-draft-issue": {
        const { projectId, title, body = "" } = args;
        const mutation = `mutation($projectId:ID!, $title:String!, $body:String!){
          addProjectV2DraftIssue(input:{projectId:$projectId, title:$title, body:$body}){ 
            projectItem { id content { ... on DraftIssue { id title body } } }
          }
        }`;
        const { data } = await octokit.graphql(mutation, { projectId, title, body });
        return {
          content: [
            {
              type: "text",
              text: `✅ Created draft issue in project\nTitle: ${title}\nProject Item ID: ${data.addProjectV2DraftIssue.projectItem.id}`
            }
          ]
        };
      }

      case "project-get": {
        const { owner, number } = args;
        const query = `query($owner:String!, $number:Int!){
          user(login:$owner){ projectV2(number:$number){ id title url shortDescription } }
          organization(login:$owner){ projectV2(number:$number){ id title url shortDescription } }
        }`;
        const { data } = await octokit.graphql(query, { owner, number });
        const project = data.user?.projectV2 || data.organization?.projectV2;
        
        if (!project) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Project #${number} not found for ${owner}`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `📋 Project: ${project.title}\nID: ${project.id}\nURL: ${project.url}\nDescription: ${project.shortDescription || 'No description'}`
            }
          ]
        };
      }

      case "ask-expert": {
        const { question, context = "", reasoning_effort = "medium" } = args;
        
        // Get environment variables
        const OPENAI_API_KEY = getEnv("AZURE_OPENAI_API_KEY");
        const OPENAI_ENDPOINT = getEnv("AZURE_OPENAI_ENDPOINT");
        const GPT5_DEPLOYMENT = process.env.AZURE_OPENAI_GPT5_DEPLOYMENT || "gpt-5";
        
        // Construct the prompt with context
        const fullPrompt = context 
          ? `${question}\n\nContext:\n${context}`
          : question;

        console.error(`🤔 Asking expert AI (${GPT5_DEPLOYMENT}, effort: ${reasoning_effort}): ${question.substring(0, 100)}...`);
        
        const apiVersion = '2024-12-01-preview';
        const chatUrl = `${OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${GPT5_DEPLOYMENT}/chat/completions?api-version=${apiVersion}`;
        
        const requestBody = {
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ],
          max_completion_tokens: 100000,
          reasoning_effort: reasoning_effort
        };

        const response = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'api-key': OPENAI_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Azure OpenAI API error: ${response.status} ${error}`);
        }

        const completion = await response.json();
        const answer = completion.choices[0].message.content;
        const reasoning_tokens = completion.usage?.completion_tokens_details?.reasoning_tokens || 0;
        const total_tokens = completion.usage?.total_tokens || 0;

        console.error(`✅ Expert response received (${total_tokens} tokens, ${reasoning_tokens} reasoning tokens)`);

        return {
          content: [
            {
              type: "text",
              text: `🧠 **Expert Analysis (${GPT5_DEPLOYMENT})**\n\n${answer}\n\n---\n*Reasoning tokens: ${reasoning_tokens} | Total tokens: ${total_tokens}*`
            }
          ]
        };
      }

      case "ask-architect": {
        const { question, workspacePath: customWorkspacePath } = args;
        
        // workspacePath is now required, no fallback
        if (!customWorkspacePath) {
          throw new Error(
            'workspacePath parameter is required.\n' +
            'Example: workspacePath="/Users/username/Github/my-project"'
          );
        }
        
        const archDocPath = join(customWorkspacePath, '.vscode/docs/ARCHITECTURE.md');
        
        console.error(`📐 Asking architect about: ${question.substring(0, 80)}...`);
        console.error(`📁 Workspace: ${customWorkspacePath}`);
        console.error(`📄 Looking for: ${archDocPath}`);
        
        try {
          // Check if file exists
          if (!existsSync(archDocPath)) {
            throw new Error(
              `Architecture document not found at:\n${archDocPath}\n\n` +
              `Expected location: <workspace>/.vscode/docs/ARCHITECTURE.md\n` +
              `Workspace provided: ${customWorkspacePath}`
            );
          }
          
          // Read architecture document
          const archContent = readFileSync(archDocPath, 'utf8');
          const archLines = archContent.split('\n');
          
          // Get Azure OpenAI credentials
          const OPENAI_ENDPOINT = getEnv("AZURE_OPENAI_ENDPOINT");
          const OPENAI_API_KEY = getEnv("AZURE_OPENAI_API_KEY");
          const GPT5_DEPLOYMENT = getEnv("AZURE_OPENAI_GPT5_DEPLOYMENT");
          
          // Call Azure OpenAI architect agent
          const systemPrompt = `You are a senior system architect helping developers understand architecture documentation.

You have the complete architecture document. Answer questions using ONLY this document.

Rules:
1. Be concise and specific
2. Cite sections and line numbers from the document
3. If document is incomplete/unclear, propose line-based edits to improve it

Return JSON with this exact structure:
{
  "answer": "Concise answer to the question",
  "sources": [
    {
      "section": "Section heading from document",
      "line_range": "L45-L67",
      "excerpt": "Relevant quote from that section (max 200 chars)"
    }
  ],
  "edits": [
    {
      "line_start": 145,
      "line_end": 147,
      "current_text": "Exact current text at those lines",
      "new_text": "Improved replacement text",
      "reason": "Why this change improves the documentation"
    }
  ],
  "gaps": ["List of missing documentation areas discovered"]
}

Only include "edits" if the document genuinely needs updates. Don't propose edits for complete sections.`;

          const userPrompt = `ARCHITECTURE DOCUMENT:
\`\`\`markdown
${archContent}
\`\`\`

USER QUESTION: ${question}

Analyze the architecture document and answer the question. Cite specific sections and line numbers.`;

          const apiVersion = '2024-12-01-preview';
          const chatUrl = `${OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${GPT5_DEPLOYMENT}/chat/completions?api-version=${apiVersion}`;
          
          const requestBody = {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_completion_tokens: 10000,
            reasoning_effort: 'medium',
            response_format: { type: 'json_object' }
          };

          const response = await fetch(chatUrl, {
            method: 'POST',
            headers: {
              'api-key': OPENAI_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Azure OpenAI API error: ${response.status} ${error}`);
          }

          const completion = await response.json();
          
          let messageContent = completion.choices[0].message.content;
          
          if (!messageContent && completion.choices[0].message.reasoning_content) {
            messageContent = completion.choices[0].message.reasoning_content;
          }
          
          if (!messageContent) {
            throw new Error('No content returned from OpenAI API');
          }
          
          // Parse JSON response
          let result;
          try {
            result = JSON.parse(messageContent);
          } catch (parseError) {
            throw new Error(`OpenAI returned non-JSON response: ${parseError.message}`);
          }
          
          // Validate edits
          if (result.edits && result.edits.length > 0) {
            result.edits = result.edits.filter(edit => {
              if (!edit.line_start || !edit.line_end || !edit.current_text) {
                return false;
              }
              
              const actualText = archLines
                .slice(edit.line_start - 1, edit.line_end)
                .join('\n');
              
              return actualText.trim() === edit.current_text.trim();
            });
            
            if (result.edits.length === 0) {
              delete result.edits;
            }
          }
          
          // Format response
          let responseText = `**Answer:**\n${result.answer}\n\n`;
          
          if (result.sources && result.sources.length > 0) {
            responseText += `**Sources:**\n`;
            result.sources.forEach(src => {
              responseText += `- ${src.section} (${src.line_range}): "${src.excerpt}"\n`;
            });
            responseText += '\n';
          }
          
          if (result.edits && result.edits.length > 0) {
            responseText += `**📝 Proposed Documentation Updates:**\n\n`;
            result.edits.forEach((edit, idx) => {
              responseText += `**Edit ${idx + 1}** (lines ${edit.line_start}-${edit.line_end}):\n`;
              responseText += `*Reason:* ${edit.reason}\n\n`;
              responseText += `\`\`\`diff\n`;
              responseText += `- ${edit.current_text.split('\n').join('\n- ')}\n`;
              responseText += `+ ${edit.new_text.split('\n').join('\n+ ')}\n`;
              responseText += `\`\`\`\n\n`;
            });
            responseText += `*To apply these edits, I can update .vscode/docs/ARCHITECTURE.md for you.*\n\n`;
          }
          
          if (result.gaps && result.gaps.length > 0) {
            responseText += `**🔍 Documentation Gaps Found:**\n`;
            result.gaps.forEach(gap => {
              responseText += `- ${gap}\n`;
            });
          }
          
          console.error(`✅ Architect answered (${result.sources?.length || 0} sources, ${result.edits?.length || 0} edits)`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ],
            _meta: result
          };
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ Architecture document not found at: ${archDocPath}\n\nPlease create .vscode/docs/ARCHITECTURE.md first.`
                }
              ],
              isError: true
            };
          }
          
          throw error;
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`❌ Tool error [${name}]:`, error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("knowing-mcp server running on stdio");
  console.error(`Workspace: ${process.env.WORKSPACE_ROOT || process.cwd()}`);
  console.error(`Browser Profile: ${process.env.BROWSER_USER_DATA_DIR || '~/.mcp-chrome'}`);
  
  // Cleanup on exit
  process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down...');
    await closeBrowser();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down...');
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
