# Markdown Tools Setup

Complete setup guide for the Markdown editing tools in **knowing-mcp**.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- knowing-mcp installed and configured

## Quick Install

```bash
pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

## Detailed Installation

### Step 1: Check Python Version

```bash
python3 --version
```

Should show Python 3.8 or higher. If not, install Python from [python.org](https://www.python.org/).

### Step 2: Install Core Dependencies

```bash
# Core markdown parsing library
pip install markdown-it-py

# YAML front matter support
pip install pyyaml

# Optional: Formatting support
pip install mdformat mdformat-gfm
```

### Step 3: Verify Installation

```bash
python3 -c "import markdown_it; import yaml; print('✅ All dependencies installed')"
```

### Step 4: Test the Tools

```bash
cd /path/to/knowing-mcp
npm run test:markdown
```

## Dependency Details

### Required

| Package | Purpose | Docs |
|---------|---------|------|
| **markdown-it-py** | CommonMark/GFM parser | [docs](https://markdown-it-py.readthedocs.io/) |
| **pyyaml** | YAML front matter handling | [docs](https://pyyaml.org/) |

### Optional

| Package | Purpose | Docs |
|---------|---------|------|
| **mdformat** | Auto-formatting | [docs](https://mdformat.readthedocs.io/) |
| **mdformat-gfm** | GFM tables/task lists | [PyPI](https://pypi.org/project/mdformat-gfm/) |

**Without optional packages**: Tools work but `format="mdformat"` option will fail.

## Platform-Specific Notes

### macOS

```bash
# Usually Python 3 is pre-installed, but upgrade if needed
brew install python3

# Install dependencies
pip3 install markdown-it-py pyyaml mdformat mdformat-gfm
```

### Windows

```bash
# Install Python from python.org first

# Then install dependencies
pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

### Linux (Ubuntu/Debian)

```bash
# Install Python and pip
sudo apt update
sudo apt install python3 python3-pip

# Install dependencies
pip3 install markdown-it-py pyyaml mdformat mdformat-gfm
```

### Linux (Fedora/RHEL)

```bash
# Install Python and pip
sudo dnf install python3 python3-pip

# Install dependencies
pip3 install markdown-it-py pyyaml mdformat mdformat-gfm
```

## Virtual Environments (Recommended)

For project isolation:

```bash
# Create virtual environment
python3 -m venv ~/.venvs/knowing-mcp

# Activate it
source ~/.venvs/knowing-mcp/bin/activate  # macOS/Linux
# or
~/.venvs/knowing-mcp/Scripts/activate  # Windows

# Install dependencies
pip install markdown-it-py pyyaml mdformat mdformat-gfm

# Deactivate when done
deactivate
```

**Note**: If using a virtual environment, ensure Python is activated when VS Code calls the tools.

## Troubleshooting

### "markdown-it-py not found"

```bash
# Check if installed
pip list | grep markdown-it-py

# If not found, install
pip install markdown-it-py
```

### "yaml not found"

```bash
# Install pyyaml (package name differs from import name)
pip install pyyaml

# Verify
python3 -c "import yaml; print(yaml.__version__)"
```

### "mdformat not found"

This is optional. Either:

```bash
# Option 1: Install it
pip install mdformat mdformat-gfm

# Option 2: Don't use format="mdformat" in md-apply calls
```

### Permission Errors

```bash
# Use user install
pip install --user markdown-it-py pyyaml mdformat mdformat-gfm

# Or use sudo (not recommended)
sudo pip install markdown-it-py pyyaml mdformat mdformat-gfm
```

### Multiple Python Versions

```bash
# Explicitly use Python 3
python3 -m pip install markdown-it-py pyyaml mdformat mdformat-gfm

# Check which Python VS Code uses
which python3
```

## VS Code Integration

The tools are called by the MCP server automatically. No extra configuration needed if:

1. Python dependencies are installed
2. `python3` command works in your terminal
3. knowing-mcp is configured in VS Code

### Test in VS Code

Open Copilot Chat and try:

```
@workspace /md-stat README.md
```

If you see errors about missing libraries, check the Output panel:

1. View → Output
2. Select "GitHub Copilot Chat" from dropdown
3. Look for Python errors

## Upgrading

```bash
# Upgrade all dependencies
pip install --upgrade markdown-it-py pyyaml mdformat mdformat-gfm
```

## Uninstall

```bash
# Remove all dependencies
pip uninstall markdown-it-py pyyaml mdformat mdformat-gfm
```

## Next Steps

- Read [MARKDOWN-TOOLS.md](MARKDOWN-TOOLS.md) for tool documentation
- See [MARKDOWN-EXAMPLES.md](MARKDOWN-EXAMPLES.md) for usage examples
- Try the test suite: `npm run test:markdown`

## Support

If you encounter issues:

1. Check Python version: `python3 --version`
2. Verify dependencies: `pip list | grep -E "markdown-it|yaml|mdformat"`
3. Run test suite: `npm run test:markdown`
4. Check [GitHub Issues](https://github.com/aponomy/knowing-mcp/issues)
