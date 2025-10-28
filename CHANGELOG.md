# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
