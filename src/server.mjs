#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import { execSync } from 'child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import fetch from "node-fetch";
import OpenAI from "openai";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
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
  {
    name: "append-csv-row",
    description: "Append a single row to a CSV file. This tool is designed for incrementally building CSV datasets from browser automation or other data collection workflows. The tool handles proper CSV formatting and creates the file if it doesn't exist.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Absolute path to the CSV file (e.g., /Users/username/project/data/results.csv)"
        },
        row: {
          type: "array",
          description: "Array of values to append as a new row. Values can be strings, numbers, or null. Will be properly escaped for CSV format.",
          items: {
            type: ["string", "number", "null"]
          }
        }
      },
      required: ["filePath", "row"]
    }
  },
  {
    name: "github-token-check",
    description: "Check what your GitHub token can access - useful for debugging permission issues",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "md-stat",
    description: "Get markdown file statistics and structure. Returns metadata including SHA-256 hash, encoding, line endings, sections, code blocks, tables, and front matter.\n\n✅ ALWAYS call this BEFORE md-apply to:\n1. Get baseSha256 (required for md-apply)\n2. Get correct headingPath arrays for each section (use sections[].headingPath)\n3. Get sectionId for stable references (use sections[].sectionId)\n\nExample section: {\"headingPath\":[\"Parent\",\"Child\"],\"sectionId\":\"child-15\",\"canonicalHeadingPath\":[\"parent\",\"child\"]}",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Absolute path to the markdown file"
        }
      },
      required: ["file"]
    }
  },
  {
    name: "md-validate",
    description: "Validate markdown file for syntax errors and optionally preview formatting changes. Returns diagnostics and can show what mdformat would change without modifying the file.",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Absolute path to the markdown file"
        },
        autofixPreview: {
          type: "boolean",
          description: "Show format preview without writing (requires mdformat installed)"
        }
      },
      required: ["file"]
    }
  },
  {
    name: "md-apply",
    description: "Apply deterministic, Markdown-aware edits to a file. Supports atomic transactions, dry-run mode, and various edit operations. Always call md-stat first to get baseSha256.\n\n⚠️ IMPORTANT: Use correct field names:\n- Use 'headingPath' (array) NOT 'heading' (string)\n- Use 'markdown' NOT 'content'\n- Example: {\"op\":\"replace_section\",\"headingPath\":[\"Section Name\"],\"markdown\":\"## Section Name\\n\\nContent...\"}",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Absolute path to the markdown file"
        },
        baseSha256: {
          type: "string",
          description: "SHA-256 hash from md-stat (ensures file hasn't changed)"
        },
        atomic: {
          type: "boolean",
          description: "If true, all edits must succeed or none are applied (default: true)"
        },
        dryRun: {
          type: "boolean",
          description: "If true, shows diff without writing changes (default: false)"
        },
        format: {
          type: "string",
          enum: ["none", "mdformat"],
          description: "Apply formatting after edits (default: none)"
        },
        preserveEol: {
          type: "boolean",
          description: "Preserve original line endings (default: true)"
        },
        preserveEncoding: {
          type: "boolean",
          description: "Preserve original file encoding (default: true)"
        },
        ensureFinalNewline: {
          type: "boolean",
          description: "Ensure file ends with newline (default: true)"
        },
        edits: {
          type: "array",
          description: "Array of edit operations. Each operation must use correct field names:\n\nreplace_section: {\"op\":\"replace_section\",\"headingPath\":[\"Parent\",\"Child\"],\"markdown\":\"## Child\\n\\ncontent...\",\"keepSubsections\":false}\n  ↑ Tip: Include heading in markdown to replace it, or omit heading to keep original\n\ninsert_after_heading: {\"op\":\"insert_after_heading\",\"headingPath\":[\"Section\"],\"markdown\":\"content\",\"position\":\"afterHeading\"}\nreplace_match: {\"op\":\"replace_match\",\"pattern\":\"text\",\"replacement\":\"new\",\"literal\":true}\nupdate_front_matter: {\"op\":\"update_front_matter\",\"set\":{\"key\":\"value\"}}\n\n⚠️ headingPath must be ARRAY with full hierarchy, NOT string!",
          items: {
            type: "object",
            properties: {
              op: {
                type: "string",
                enum: ["replace_range", "replace_match", "replace_section", "insert_after_heading", "update_front_matter"],
                description: "Type of edit operation"
              },
              headingPath: {
                type: "array",
                items: { type: "string" },
                description: "⚠️ REQUIRED for replace_section/insert_after_heading: Array of heading names forming path (e.g., ['Parent', 'Child']). NOT a string! Get correct paths from md-stat."
              },
              markdown: {
                type: "string",
                description: "⚠️ REQUIRED for replace_section/insert_after_heading: Markdown content. For replace_section: Can include heading (replaces entire section) OR just content (keeps original heading). For insert_after_heading: Content only. NOT 'content'!"
              },
              sectionId: {
                type: "string",
                description: "Alternative to headingPath: stable section ID from md-stat"
              },
              keepSubsections: {
                type: "boolean",
                description: "For replace_section: preserve subsections (default: false)"
              },
              pattern: {
                type: "string",
                description: "For replace_match: text or regex pattern to find"
              },
              replacement: {
                type: "string",
                description: "For replace_match: replacement text"
              },
              literal: {
                type: "boolean",
                description: "For replace_match: treat pattern as literal string, not regex (default: true)"
              },
              expectedMatches: {
                type: "number",
                description: "For replace_match: exact number of matches expected (fails if different)"
              },
              scope: {
                type: "object",
                description: "For replace_match: limit search scope (default: whole_document)"
              }
            },
            required: ["op"]
          }
        }
      },
      required: ["file", "baseSha256", "edits"]
    }
  },
  {
    name: "read-pdf",
    description: "Read a PDF file and extract its content as text or markdown. Returns the full text content, metadata (title, author, etc.), and page-by-page breakdown. Markdown format includes structured headings and document information. For large documents, use outputPath to save to a file instead of returning the content.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Absolute path to the PDF file (e.g., /Users/username/documents/report.pdf)"
        },
        format: {
          type: "string",
          enum: ["text", "markdown"],
          description: "Output format: 'text' for plain text, 'markdown' for structured markdown (default: markdown)"
        },
        outputPath: {
          type: "string",
          description: "Optional: Save output to this file path instead of returning content (recommended for large documents). E.g., /Users/username/workspace/output.md"
        }
      },
      required: ["filePath"]
    }
  },
  {
    name: "read-docx",
    description: "Read a Microsoft Word (.docx) file and extract its content as text or markdown. Returns the full text content, metadata (title, author, etc.), paragraphs, and tables. Markdown format includes structured headings based on Word styles and properly formatted tables. For large documents, use outputPath to save to a file instead of returning the content.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Absolute path to the DOCX file (e.g., /Users/username/documents/report.docx)"
        },
        format: {
          type: "string",
          enum: ["text", "markdown"],
          description: "Output format: 'text' for plain text, 'markdown' for structured markdown (default: markdown)"
        },
        outputPath: {
          type: "string",
          description: "Optional: Save output to this file path instead of returning content (recommended for large documents). E.g., /Users/username/workspace/output.md"
        }
      },
      required: ["filePath"]
    }
  },
  {
    name: "make-pdf",
    description: "Convert a Markdown file to PDF format with professional styling. Uses weasyprint for high-quality output with automatic page numbers. Supports custom fonts (Helvetica default, Georgia, Times New Roman, Arial), adjustable line height for readability, font size, and paper size. The generated PDF has formatted headings, syntax-highlighted code blocks, tables, and professional typography with 2.5cm margins.",
    inputSchema: {
      type: "object",
      properties: {
        mdFile: {
          type: "string",
          description: "Absolute path to the Markdown file to convert (e.g., /Users/username/documents/README.md)"
        },
        pdfFile: {
          type: "string",
          description: "Optional: Output PDF path. If not specified, creates PDF with same name as markdown file (e.g., README.md -> README.pdf)"
        },
        toc: {
          type: "boolean",
          description: "Include table of contents (default: false)"
        },
        paperSize: {
          type: "string",
          description: "Paper size: 'A4' (default), 'Letter', 'Legal', etc."
        },
        fontFamily: {
          type: "string",
          description: "Font family: e.g., 'Helvetica, Arial, sans-serif' (default), 'Georgia, serif', 'Times New Roman, serif'"
        },
        lineHeight: {
          type: "string",
          description: "Line height: e.g., '1.2' (default, compact), '1.5', '1.8', '2.0' (double-spaced)"
        },
        fontSize: {
          type: "string",
          description: "Base font size: e.g., '10pt', '11pt' (default), '12pt'"
        }
      },
      required: ["mdFile"]
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
        
        let project = null;
        let ownerType = null;
        let orgExists = false;
        let userExists = false;
        let allOrgProjects = [];
        
        // Try organization first (most common for projects)
        try {
          const orgQuery = `query($owner:String!, $number:Int!){
            organization(login:$owner){ 
              login
              projectV2(number:$number){ 
                id 
                title 
                url 
                shortDescription 
              }
              projectsV2(first: 50, orderBy: {field: NUMBER, direction: ASC}) {
                nodes { 
                  number 
                  title 
                  url 
                }
              }
            }
          }`;
          const { data } = await octokit.graphql(orgQuery, { owner, number });
          if (data?.organization) {
            orgExists = true;
            allOrgProjects = data.organization.projectsV2?.nodes || [];
            project = data.organization.projectV2;
            if (project) {
              ownerType = 'organization';
            }
          }
        } catch (orgError) {
          // Not an organization, access denied, or GraphQL error
          console.error(`⚠️  Organization lookup failed: ${orgError.message}`);
          // GraphQL errors might indicate "not found" or "no access"
        }
        
        // If not found in organization, try user account
        if (!project) {
          try {
            const userQuery = `query($owner:String!, $number:Int!){
              user(login:$owner){ 
                login
                projectV2(number:$number){ 
                  id 
                  title 
                  url 
                  shortDescription 
                } 
                projectsV2(first: 50, orderBy: {field: NUMBER, direction: ASC}) {
                  nodes { 
                    number 
                    title 
                    url 
                  }
                }
              }
            }`;
            const { data } = await octokit.graphql(userQuery, { owner, number });
            if (data?.user) {
              userExists = true;
              allOrgProjects = data.user.projectsV2?.nodes || [];
              project = data.user.projectV2;
              if (project) {
                ownerType = 'user';
              }
            }
          } catch (userError) {
            console.error(`⚠️  User lookup failed: ${userError.message}`);
          }
        }
        
        if (!project) {
          let errorMsg = `❌ Project #${number} not found for ${owner}\n\n`;
          
          if (orgExists || userExists) {
            errorMsg += `The ${orgExists ? 'organization' : 'user'} "${owner}" exists.\n\n`;
            
            // Show available projects if any
            if (allOrgProjects.length > 0) {
              errorMsg += `✅ Your token CAN see Projects v2 for this ${orgExists ? 'org' : 'user'}!\n\n`;
              errorMsg += `**Available Projects v2:**\n`;
              allOrgProjects.forEach(p => {
                errorMsg += `- #${p.number}: ${p.title}\n  ${p.url}\n`;
              });
              errorMsg += `\n**Issue:** Project #${number} is not in this list.\n\n`;
              errorMsg += `**Possible reasons:**\n`;
              errorMsg += `- Wrong project number (double-check the URL)\n`;
              errorMsg += `- Project was deleted or moved\n`;
              errorMsg += `- You don't have access to this specific project\n`;
            } else {
              errorMsg += `⚠️  **GitHub Token Permission Issue Detected**\n\n`;
              errorMsg += `Your token cannot see ANY Projects v2 for "${owner}".\n\n`;
              errorMsg += `**For Projects v2 (new GitHub Projects), you need:**\n`;
              errorMsg += `- ✅ \`read:org\` scope (for organization projects)\n`;
              errorMsg += `- ✅ Token must be SSO-authorized if org enforces SAML SSO\n\n`;
              errorMsg += `⚠️  NOTE: The \`project\` scope is for **classic Projects** (v1), NOT Projects v2!\n\n`;
              errorMsg += `**To fix this:**\n`;
              errorMsg += `1. Go to: https://github.com/settings/tokens\n`;
              errorMsg += `2. Find your "knowing-mcp" token\n`;
              errorMsg += `3. Ensure these scopes are selected:\n`;
              errorMsg += `   ✅ repo\n`;
              errorMsg += `   ✅ read:org (REQUIRED for Projects v2!)\n`;
              errorMsg += `   ✅ project (optional, only for classic projects)\n`;
              errorMsg += `4. Click "Configure SSO" and authorize for "${owner}"\n`;
              errorMsg += `5. Update the token in VS Code settings\n`;
              errorMsg += `6. Restart VS Code\n\n`;
              errorMsg += `**Alternative: Use Fine-grained PAT**\n`;
              errorMsg += `1. Create at: https://github.com/settings/personal-access-tokens/new\n`;
              errorMsg += `2. Resource owner: ${owner}\n`;
              errorMsg += `3. Organization permissions → Projects: Read-only\n`;
              errorMsg += `4. Use this token instead\n`;
            }
          } else {
            errorMsg += `Could not find user or organization: "${owner}"\n\n`;
            errorMsg += `Please verify the owner name is correct.`;
          }
          
          return {
            content: [
              {
                type: "text",
                text: errorMsg
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `📋 Project: ${project.title}\n` +
                    `Owner: ${owner} (${ownerType})\n` +
                    `ID: ${project.id}\n` +
                    `URL: ${project.url}\n` +
                    `Description: ${project.shortDescription || 'No description'}`
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

      case "append-csv-row": {
        const { filePath, row } = args;
        
        if (!filePath) {
          throw new Error('filePath is required');
        }
        
        if (!Array.isArray(row)) {
          throw new Error('row must be an array');
        }
        
        console.error(`📊 Appending row to CSV: ${filePath}`);
        
        try {
          // Ensure directory exists
          const dir = dirname(filePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
            console.error(`✅ Created directory: ${dir}`);
          }
          
          // CSV escape function - handles quotes and commas
          const escapeCsvValue = (value) => {
            if (value === null || value === undefined) {
              return '';
            }
            
            const str = String(value);
            
            // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            
            return str;
          };
          
          // Convert row to CSV line
          const csvLine = row.map(escapeCsvValue).join(',') + '\n';
          
          // Check if file exists to determine if it's a new file
          const isNewFile = !existsSync(filePath);
          
          // Append to file (creates if doesn't exist)
          appendFileSync(filePath, csvLine, 'utf8');
          
          console.error(`✅ Appended row to ${filePath} (${row.length} columns)`);
          
          return {
            content: [
              {
                type: "text",
                text: `✅ ${isNewFile ? 'Created CSV file and appended' : 'Appended'} row to: ${filePath}\n` +
                      `Columns: ${row.length}\n` +
                      `Data: ${row.map(v => v === null ? 'null' : String(v)).join(', ')}`
              }
            ]
          };
          
        } catch (error) {
          throw new Error(`Failed to append to CSV: ${error.message}`);
        }
      }

      case "github-token-check": {
        console.error('🔍 Checking GitHub token permissions...');
        
        try {
          // Get viewer (current user) info
          const viewerQuery = `query {
            viewer {
              login
              name
              organizations(first: 50) {
                nodes {
                  login
                  name
                }
              }
            }
          }`;
          
          const { data } = await octokit.graphql(viewerQuery);
          
          if (!data || !data.viewer) {
            throw new Error('GraphQL query returned no data - token may be invalid');
          }
          
          let result = `🔐 **GitHub Token Information**\n\n`;
          result += `**Authenticated as:** ${data.viewer.login} (${data.viewer.name || 'No name'})\n\n`;
          
          if (data.viewer.organizations.nodes.length > 0) {
            result += `**Organizations you can access:**\n`;
            data.viewer.organizations.nodes.forEach(org => {
              result += `- ${org.login} (${org.name})\n`;
            });
          } else {
            result += `⚠️ **No organizations found** - this might indicate missing \`read:org\` scope\n`;
          }
          
          return {
            content: [
              {
                type: "text",
                text: result
              }
            ]
          };
        } catch (error) {
          console.error('Token check error details:', error);
          throw new Error(`Failed to check token: ${error.message}\n\nPlease verify:\n1. GH_TOKEN is set in VS Code settings\n2. Token is valid and not expired\n3. Token has correct scopes`);
        }
      }

      case "read-pdf": {
        const { filePath, format = "markdown", outputPath } = args;
        
        if (!filePath) {
          throw new Error('filePath is required');
        }
        
        console.error(`📄 Reading PDF: ${filePath} (format: ${format}${outputPath ? ', saving to file' : ''})`);
        
        try {
          // Check if file exists
          if (!existsSync(filePath)) {
            throw new Error(`PDF file not found: ${filePath}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'read-pdf.py');
          
          // Check if Python script exists
          if (!existsSync(scriptPath)) {
            throw new Error(`PDF reader script not found: ${scriptPath}`);
          }
          
          // Build command with optional output path
          let command = `python3 "${scriptPath}" "${filePath}" --format ${format} --json`;
          if (outputPath) {
            command += ` --output "${outputPath}"`;
          }
          
          // Execute Python script
          let pythonOutput;
          try {
            pythonOutput = execSync(
              command,
              { 
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large PDFs
              }
            );
          } catch (execError) {
            // Check if it's a Python dependency issue
            if (execError.stderr && execError.stderr.includes('pypdf')) {
              throw new Error(
                'Python library "pypdf" not installed.\n\n' +
                'To fix this, run:\n' +
                '  pip install pypdf\n\n' +
                'Or install all dependencies:\n' +
                '  pip install pypdf'
              );
            }
            throw new Error(`Failed to execute PDF reader: ${execError.message}`);
          }
          
          // Parse JSON response
          const result = JSON.parse(pythonOutput);
          
          if (!result.success) {
            throw new Error(result.error || 'Unknown error reading PDF');
          }
          
          // Format the response
          let responseText = `📄 **PDF Read Successfully**\n\n`;
          responseText += `**File:** ${result.file_path}\n`;
          responseText += `**Pages:** ${result.page_count}\n`;
          
          // If saved to file, show that info
          if (result.saved_to_file) {
            responseText += `**Saved to:** ${result.saved_to_file}\n`;
            responseText += `**File size:** ${result.file_size} characters\n`;
          }
          
          if (result.metadata) {
            if (result.metadata.title) {
              responseText += `**Title:** ${result.metadata.title}\n`;
            }
            if (result.metadata.author) {
              responseText += `**Author:** ${result.metadata.author}\n`;
            }
            if (result.metadata.subject) {
              responseText += `**Subject:** ${result.metadata.subject}\n`;
            }
          }
          
          responseText += `\n---\n\n`;
          
          // Add content based on format (only if not saved to file)
          if (!result.saved_to_file) {
            if (format === 'markdown' && result.markdown) {
              responseText += result.markdown;
            } else if (result.text) {
              responseText += result.text;
            }
          } else {
            responseText += `📝 Content has been saved to the file specified. Use VS Code to open and view the file.`;
          }
          
          console.error(`✅ Successfully read PDF: ${result.page_count} pages${result.saved_to_file ? ' (saved to file)' : ''}`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ]
          };
          
        } catch (error) {
          throw new Error(`Failed to read PDF: ${error.message}`);
        }
      }

      case "read-docx": {
        const { filePath, format = "markdown", outputPath } = args;
        
        if (!filePath) {
          throw new Error('filePath is required');
        }
        
        console.error(`📝 Reading DOCX: ${filePath} (format: ${format}${outputPath ? ', saving to file' : ''})`);
        
        try {
          // Check if file exists
          if (!existsSync(filePath)) {
            throw new Error(`DOCX file not found: ${filePath}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'read-docx.py');
          
          // Check if Python script exists
          if (!existsSync(scriptPath)) {
            throw new Error(`DOCX reader script not found: ${scriptPath}`);
          }
          
          // Build command with optional output path
          let command = `python3 "${scriptPath}" "${filePath}" --format ${format} --json`;
          if (outputPath) {
            command += ` --output "${outputPath}"`;
          }
          
          // Execute Python script
          let pythonOutput;
          try {
            pythonOutput = execSync(
              command,
              { 
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large documents
              }
            );
          } catch (execError) {
            // Check if it's a Python dependency issue
            if (execError.stderr && execError.stderr.includes('python-docx')) {
              throw new Error(
                'Python library "python-docx" not installed.\n\n' +
                'To fix this, run:\n' +
                '  pip install python-docx\n\n' +
                'Or install all document processing dependencies:\n' +
                '  pip install pypdf python-docx'
              );
            }
            throw new Error(`Failed to execute DOCX reader: ${execError.message}`);
          }
          
          // Parse JSON response
          const result = JSON.parse(pythonOutput);
          
          if (!result.success) {
            throw new Error(result.error || 'Unknown error reading DOCX');
          }
          
          // Format the response
          let responseText = `📝 **Word Document Read Successfully**\n\n`;
          responseText += `**File:** ${result.file_path}\n`;
          responseText += `**Paragraphs:** ${result.paragraph_count}\n`;
          
          if (result.table_count > 0) {
            responseText += `**Tables:** ${result.table_count}\n`;
          }
          
          // If saved to file, show that info
          if (result.saved_to_file) {
            responseText += `**Saved to:** ${result.saved_to_file}\n`;
            responseText += `**File size:** ${result.file_size} characters\n`;
          }
          
          if (result.metadata) {
            if (result.metadata.title) {
              responseText += `**Title:** ${result.metadata.title}\n`;
            }
            if (result.metadata.author) {
              responseText += `**Author:** ${result.metadata.author}\n`;
            }
            if (result.metadata.subject) {
              responseText += `**Subject:** ${result.metadata.subject}\n`;
            }
          }
          
          responseText += `\n---\n\n`;
          
          // Add content based on format (only if not saved to file)
          if (!result.saved_to_file) {
            if (format === 'markdown' && result.markdown) {
              responseText += result.markdown;
            } else if (result.text) {
              responseText += result.text;
            }
          } else {
            responseText += `📝 Content has been saved to the file specified. Use VS Code to open and view the file.`;
          }
          
          console.error(`✅ Successfully read DOCX: ${result.paragraph_count} paragraphs, ${result.table_count} tables${result.saved_to_file ? ' (saved to file)' : ''}`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ]
          };
          
        } catch (error) {
          throw new Error(`Failed to read DOCX: ${error.message}`);
        }
      }

      case "make-pdf": {
        const { mdFile, pdfFile, toc, paperSize, fontFamily, lineHeight, fontSize } = args;
        
        if (!mdFile) {
          throw new Error('mdFile is required');
        }
        
        console.error(`📄 Converting Markdown to PDF: ${mdFile}`);
        
        try {
          // Check if file exists
          if (!existsSync(mdFile)) {
            throw new Error(`Markdown file not found: ${mdFile}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'make-pdf.py');
          
          // Check if Python script exists
          if (!existsSync(scriptPath)) {
            throw new Error(`PDF maker script not found: ${scriptPath}`);
          }
          
          // Build command - always use weasyprint
          let command = `python3 "${scriptPath}" "${mdFile}" --method weasyprint`;
          
          if (pdfFile) {
            command += ` --output "${pdfFile}"`;
          }
          if (toc) {
            command += ` --toc`;
          }
          if (paperSize) {
            command += ` --paper-size ${paperSize}`;
          }
          if (fontFamily) {
            command += ` --font-family "${fontFamily}"`;
          }
          if (lineHeight) {
            command += ` --line-height ${lineHeight}`;
          }
          if (fontSize) {
            command += ` --font-size ${fontSize}`;
          }
          
          // Execute Python script
          let pythonOutput;
          try {
            pythonOutput = execSync(
              command,
              { 
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
              }
            );
          } catch (execError) {
            // Check if it's a dependency issue
            const stderr = execError.stderr || '';
            if (stderr.includes('weasyprint') || stderr.includes('markdown')) {
              throw new Error(
                'Python libraries for PDF conversion not installed.\n\n' +
                'To fix this, install dependencies:\n' +
                '  pip install markdown weasyprint\n\n' +
                'Or for best quality, install pandoc:\n' +
                '  macOS: brew install pandoc\n' +
                '  Ubuntu/Debian: sudo apt-get install pandoc\n' +
                '  Windows: https://pandoc.org/installing.html'
              );
            }
            throw new Error(`Failed to execute PDF maker: ${execError.message}`);
          }
          
          // Parse JSON response
          const result = JSON.parse(pythonOutput);
          
          if (!result.success) {
            throw new Error(result.error || 'Unknown error creating PDF');
          }
          
          // Format the response
          let responseText = `📄 **PDF Created Successfully**\n\n`;
          responseText += `**Input:** ${mdFile}\n`;
          responseText += `**Output:** ${result.pdfPath}\n`;
          responseText += `**Size:** ${(result.pdfSize / 1024).toFixed(2)} KB\n`;
          responseText += `**Method:** ${result.method}\n`;
          
          if (toc) {
            responseText += `**Table of Contents:** Yes\n`;
          }
          if (engine) {
            responseText += `**PDF Engine:** ${engine}\n`;
          }
          
          responseText += `\n✅ PDF file has been created and is ready to use.`;
          
          console.error(`✅ Successfully created PDF: ${result.pdfPath} (${(result.pdfSize / 1024).toFixed(2)} KB)`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ]
          };
          
        } catch (error) {
          throw new Error(`Failed to create PDF: ${error.message}`);
        }
      }

      case "md-stat": {
        const { file } = args;
        
        if (!file) {
          throw new Error('file path is required');
        }
        
        console.error(`📊 Getting markdown stats: ${file}`);
        
        try {
          // Check if file exists
          if (!existsSync(file)) {
            throw new Error(`Markdown file not found: ${file}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'markdown-tools.py');
          
          // Check if Python script exists
          if (!existsSync(scriptPath)) {
            throw new Error(`Markdown tools script not found: ${scriptPath}`);
          }
          
          // Execute Python script
          let pythonOutput;
          try {
            pythonOutput = execSync(
              `python3 "${scriptPath}" stat --file "${file}"`,
              { 
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024
              }
            );
          } catch (execError) {
            // Check for dependency issues
            if (execError.stderr && execError.stderr.includes('markdown-it-py')) {
              throw new Error(
                'Python library "markdown-it-py" not installed.\n\n' +
                'To fix this, run:\n' +
                '  pip install markdown-it-py pyyaml mdformat mdformat-gfm\n'
              );
            }
            throw new Error(`Failed to execute markdown-tools: ${execError.message}`);
          }
          
          // Parse JSON response
          const result = JSON.parse(pythonOutput);
          
          if (!result.ok) {
            throw new Error(result.error || 'Unknown error analyzing markdown');
          }
          
          // Format the response
          let responseText = `📊 **Markdown File Analysis**\n\n`;
          responseText += `**File:** ${result.filePath}\n`;
          responseText += `**SHA-256:** \`${result.contentSha256}\`\n`;
          responseText += `**Encoding:** ${result.encoding}\n`;
          responseText += `**Line Endings:** ${result.eol}\n`;
          responseText += `**Lines:** ${result.lineCount}\n`;
          responseText += `**Sections:** ${result.sections.length}\n`;
          responseText += `**Code Blocks:** ${result.codeBlocks.length}\n`;
          responseText += `**Tables:** ${result.tables.length}\n`;
          
          if (result.hasFrontMatter) {
            responseText += `**Front Matter:** Yes\n`;
          }
          
          if (result.sections.length > 0) {
            responseText += `\n### Sections\n\n`;
            for (const section of result.sections) {
              const indent = '  '.repeat(section.level - 1);
              responseText += `${indent}- ${section.headingPath.join(' > ')} (lines ${section.startLine}-${section.endLine})\n`;
            }
          }
          
          if (result.codeBlocks.length > 0) {
            responseText += `\n### Code Blocks\n\n`;
            for (const block of result.codeBlocks) {
              const lang = block.language || 'unknown';
              responseText += `- ${lang} (lines ${block.startLine}-${block.endLine})\n`;
            }
          }
          
          console.error(`✅ Analyzed markdown: ${result.sections.length} sections, ${result.codeBlocks.length} code blocks`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              },
              {
                type: "resource",
                resource: {
                  uri: `file://${file}`,
                  mimeType: "text/markdown",
                  text: `SHA-256: ${result.contentSha256}`
                }
              }
            ],
            _meta: result // Include full result for programmatic access
          };
          
        } catch (error) {
          throw new Error(`Failed to analyze markdown: ${error.message}`);
        }
      }

      case "md-validate": {
        const { file, autofixPreview = false } = args;
        
        if (!file) {
          throw new Error('file path is required');
        }
        
        console.error(`🔍 Validating markdown: ${file}`);
        
        try {
          // Check if file exists
          if (!existsSync(file)) {
            throw new Error(`Markdown file not found: ${file}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'markdown-tools.py');
          
          // Execute Python script
          let command = `python3 "${scriptPath}" validate --file "${file}"`;
          if (autofixPreview) {
            command += ' --autofix-preview';
          }
          
          let pythonOutput;
          try {
            pythonOutput = execSync(command, { 
              encoding: 'utf8',
              maxBuffer: 10 * 1024 * 1024
            });
          } catch (execError) {
            if (execError.stderr && execError.stderr.includes('markdown-it-py')) {
              throw new Error(
                'Python library "markdown-it-py" not installed.\n\n' +
                'To fix this, run:\n' +
                '  pip install markdown-it-py pyyaml mdformat mdformat-gfm\n'
              );
            }
            throw new Error(`Failed to validate markdown: ${execError.message}`);
          }
          
          const result = JSON.parse(pythonOutput);
          
          if (!result.ok) {
            throw new Error(result.error || 'Unknown validation error');
          }
          
          // Format the response
          let responseText = `🔍 **Markdown Validation**\n\n`;
          responseText += `**File:** ${result.filePath}\n`;
          responseText += `**SHA-256:** \`${result.contentSha256}\`\n`;
          
          if (result.diagnostics.length === 0) {
            responseText += `\n✅ **No issues found**\n`;
          } else {
            responseText += `\n**Issues:** ${result.diagnostics.length}\n\n`;
            for (const diag of result.diagnostics) {
              const icon = diag.severity === 'error' ? '❌' : diag.severity === 'warning' ? '⚠️' : 'ℹ️';
              const location = diag.line ? ` (line ${diag.line}${diag.col ? `:${diag.col}` : ''})` : '';
              responseText += `${icon} **${diag.code || diag.severity}**${location}: ${diag.message}\n`;
            }
          }
          
          if (result.hasFormatChanges) {
            responseText += `\n📝 **Format changes available** (run with md-apply and format=mdformat to apply)\n`;
          } else if (autofixPreview) {
            responseText += `\n✅ **No format changes needed**\n`;
          }
          
          console.error(`✅ Validated markdown: ${result.diagnostics.length} issues`);
          
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
          throw new Error(`Failed to validate markdown: ${error.message}`);
        }
      }

      case "md-apply": {
        const { 
          file, 
          baseSha256, 
          edits,
          atomic = true,
          dryRun = false,
          format = 'none',
          preserveEol = true,
          preserveEncoding = true,
          ensureFinalNewline = true
        } = args;
        
        if (!file) {
          throw new Error('file path is required');
        }
        if (!baseSha256) {
          throw new Error('baseSha256 is required (get it from md-stat)');
        }
        if (!edits || !Array.isArray(edits)) {
          throw new Error('edits array is required');
        }
        
        // Validate edit field names
        for (let i = 0; i < edits.length; i++) {
          const edit = edits[i];
          const op = edit.op;
          
          // Check for common field name mistakes
          if (edit.heading && !edit.headingPath) {
            throw new Error(
              `Edit ${i} (op: ${op}): Use "headingPath" (array) instead of "heading" (string).\n` +
              `Example: {"op":"replace_section","headingPath":["Section Name"],"markdown":"content..."}`
            );
          }
          if (edit.content && !edit.markdown) {
            throw new Error(
              `Edit ${i} (op: ${op}): Use "markdown" instead of "content".\n` +
              `Example: {"op":"replace_section","headingPath":["Section Name"],"markdown":"content..."}`
            );
          }
          
          // Validate required fields for each operation
          if (op === 'replace_section' || op === 'insert_after_heading') {
            if (!edit.markdown) {
              throw new Error(
                `Edit ${i} (op: ${op}): Missing required field "markdown".\n` +
                `Example: {"op":"${op}","headingPath":["Section Name"],"markdown":"## Section Name\\n\\nContent here..."}`
              );
            }
            if (!edit.headingPath && !edit.sectionId) {
              throw new Error(
                `Edit ${i} (op: ${op}): Must provide either "headingPath" (array) or "sectionId".\n` +
                `Example: {"op":"${op}","headingPath":["Parent","Child"],"markdown":"content..."}`
              );
            }
          }
        }
        
        console.error(`✏️  Applying markdown edits: ${file} (${edits.length} edits, ${dryRun ? 'DRY RUN' : 'LIVE'})`);
        
        try {
          // Check if file exists
          if (!existsSync(file)) {
            throw new Error(`Markdown file not found: ${file}`);
          }
          
          // Get the path to the Python script
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const scriptPath = join(__dirname, '..', 'scripts', 'markdown-tools.py');
          
          // Write edits to a temporary file to avoid shell escaping issues
          const tmpDir = join(__dirname, '..', 'tmp');
          if (!existsSync(tmpDir)) {
            mkdirSync(tmpDir, { recursive: true });
          }
          const tmpFile = join(tmpDir, `edits-${Date.now()}.json`);
          writeFileSync(tmpFile, JSON.stringify(edits));
          
          try {
            // Build command using the temp file
            let command = `python3 "${scriptPath}" apply --file "${file}" --base-sha256 "${baseSha256}" --edits "$(cat '${tmpFile}')"`;
            
            if (atomic) {
              command += ' --atomic';
            }
            if (dryRun) {
              command += ' --dry-run';
            }
            if (format !== 'none') {
              command += ` --format ${format}`;
            }
            
            // Execute Python script
            let pythonOutput;
            try {
              pythonOutput = execSync(command, { 
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024,
                shell: '/bin/bash'
              });
            } catch (execError) {
              if (execError.stderr && execError.stderr.includes('markdown-it-py')) {
                throw new Error(
                  'Python library "markdown-it-py" not installed.\n\n' +
                  'To fix this, run:\n' +
                  '  pip install markdown-it-py pyyaml mdformat mdformat-gfm\n'
                );
              }
              
              // Try to parse error output as JSON
              try {
                const errorResult = JSON.parse(execError.stdout || execError.stderr);
                if (errorResult.error) {
                  throw new Error(errorResult.error);
                }
              } catch (parseError) {
                // Couldn't parse as JSON, use original error
              }
              
              throw new Error(`Failed to apply edits: ${execError.message}`);
            }
          
          const result = JSON.parse(pythonOutput);
          
          if (!result.ok) {
            const errorMsg = result.error || 'Unknown error applying edits';
            const errorCode = result.errorCode || 'UNKNOWN_ERROR';
            
            let responseText = `❌ **Edit Failed: ${errorCode}**\n\n${errorMsg}\n`;
            
            if (result.diagnostics && result.diagnostics.length > 0) {
              responseText += `\n**Diagnostics:**\n`;
              for (const diag of result.diagnostics) {
                const location = diag.line ? ` (line ${diag.line})` : '';
                responseText += `- ${diag.severity}: ${diag.message}${location}\n`;
              }
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: responseText
                }
              ],
              isError: true,
              _meta: result
            };
          }
          
          // Format success response
          let responseText = dryRun 
            ? `🔍 **Markdown Edit Preview (DRY RUN)**\n\n`
            : `✅ **Markdown Edits Applied**\n\n`;
          
          responseText += `**File:** ${result.filePath}\n`;
          responseText += `**Edits Applied:** ${result.editsApplied}/${edits.length}\n`;
          responseText += `**New SHA-256:** \`${result.contentSha256}\`\n`;
          
          if (result.diagnostics && result.diagnostics.length > 0) {
            responseText += `\n**Diagnostics:**\n`;
            for (const diag of result.diagnostics) {
              const icon = diag.severity === 'error' ? '❌' : diag.severity === 'warning' ? '⚠️' : 'ℹ️';
              const location = diag.line ? ` (line ${diag.line})` : '';
              responseText += `${icon} ${diag.message}${location}\n`;
            }
          }
          
          if (result.diff) {
            const diffLineCount = result.diff.split('\n').length;
            responseText += `\n### Changes Preview\n\n`;
            responseText += `\`\`\`diff\n${result.diff}\n\`\`\`\n`;
            responseText += `\n📊 **${diffLineCount} lines changed**\n`;
          }
          
          if (dryRun) {
            responseText += `\n💡 **To apply these changes, call md-apply again with dryRun=false**\n`;
          } else {
            // Suggest viewing the changes in VS Code
            responseText += `\n✨ **Changes Applied!**\n`;
            responseText += `- Open the file in VS Code to see red/green line change markers\n`;
            responseText += `- Use Source Control view to review changes\n`;
            responseText += `- Run \`git diff\` to see detailed changes\n`;
          }
          
          console.error(`✅ Applied ${result.editsApplied} edits${dryRun ? ' (dry run)' : ''}`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ],
            _meta: {
              ...result,
              modifiedFile: dryRun ? null : file  // Signal that a file was modified
            }
          };
          
          } finally {
            // Clean up temp file
            if (existsSync(tmpFile)) {
              unlinkSync(tmpFile);
            }
          }
          
        } catch (error) {
          throw new Error(`Failed to apply markdown edits: ${error.message}`);
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
