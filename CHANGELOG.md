# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Save to File Feature** for document processing tools
  - New `outputPath` parameter for `read-pdf` and `read-docx`
  - Saves output to file instead of returning content (recommended for large documents)
  - Avoids MCP response size limits
  - Auto-creates directories as needed
  - Returns metadata and file info instead of full content
  - UTF-8 encoding support
- New `read-docx` tool for Microsoft Word document processing
  - Extract text from .docx files
  - Convert Word documents to structured markdown format
  - Returns document metadata (title, author, subject, keywords, dates, revision)
  - Paragraph-by-paragraph content breakdown with style information
  - Table extraction with proper markdown formatting
  - Python-based using python-docx library
  - Supports both text and markdown output formats
  - Converts Word styles (Heading 1-6, Title, Subtitle, Quote, List) to markdown
- New `read-pdf` tool for PDF document processing
  - Extract text from PDF files
  - Convert PDFs to structured markdown format
  - Returns document metadata (title, author, subject, dates)
  - Page-by-page content breakdown
  - Python-based using pypdf library
  - Supports both text and markdown output formats
- Document processing documentation (`docs/PDF-TOOLS.md` - covers both PDF and DOCX)
  - Complete usage guide and examples for both tools
  - Troubleshooting section
  - Best practices and integration patterns
- Save to file documentation (`SAVE-TO-FILE-FEATURE.md`)
  - Complete guide for using outputPath parameter
  - Workflow examples
  - Best practices
- Document setup guide (`PDF-SETUP.md`)
- Python scripts for document reading (`scripts/read-pdf.py`, `scripts/read-docx.py`)
- Test suite for PDF functionality (`test/test-pdf.mjs`)
- `npm run test:pdf` script
- New `append-csv-row` tool for incremental CSV data collection
  - Auto-creates directories and files
  - Proper CSV escaping (commas, quotes, newlines)
  - Supports strings, numbers, and null values
  - Perfect for browser automation workflows
- CSV tools documentation (`docs/CSV-TOOLS.md`)
- CSV workflow example for citation analysis (`docs/CSV-WORKFLOW-EXAMPLE.md`)
- Test suite for CSV functionality (`test/test-csv.mjs`)
- `npm run test:csv` script

## [1.0.0] - 2025-01-11

### Added
- Initial release of knowing-mcp
- Automatic GitHub repository detection from git remote
- Support for HTTPS and SSH git URLs
- GitHub issue management tools (create, list, get, update, close, comment)
- GitHub Projects v2 support
- Azure OpenAI integration for expert assistance (ask-expert)
- Architecture documentation tool (ask-architect)
- Global credential management (VS Code settings, config file, env vars)
- Workspace-aware operation
- Comprehensive documentation (README, Quick Start, VS Code Setup)
- Test script for setup verification
- MIT License

### Features
- **11 GitHub tools**: Full issue and project management
- **2 AI tools**: Expert consultation and architecture Q&A
- **Auto-detection**: No need to specify owner/repo for each operation
- **Global installation**: Works in any VS Code workspace
- **Secure**: Multiple credential storage options with .gitignore protection
