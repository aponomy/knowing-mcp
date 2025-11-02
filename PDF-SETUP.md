# Document Processing Tools Installation

## Python Dependencies

The document processing tools (`read-pdf` and `read-docx`) require Python 3 and specific libraries.

### Quick Install

```bash
# Install both PDF and Word document support
pip install pypdf python-docx

# Or install individually:
pip install pypdf         # For PDF support
pip install python-docx   # For Word document support
```

### Verify Installation

```bash
# Check if pypdf is installed
python3 -c "import pypdf; print('✅ pypdf installed successfully')"

# Check if python-docx is installed
python3 -c "import docx; print('✅ python-docx installed successfully')"
```

### Test the Document Tools

```bash
# Run the PDF test suite
npm run test:pdf

# Or test with a specific PDF file
npm run test:pdf /path/to/your/file.pdf

# Test DOCX files manually with Python
python3 scripts/read-docx.py /path/to/your/file.docx --format markdown
```

### Troubleshooting

#### Python not found

```bash
# Check if Python 3 is installed
python3 --version

# If not found, install Python 3:
# macOS:
brew install python3

# Linux (Ubuntu/Debian):
sudo apt-get update
sudo apt-get install python3 python3-pip

# Windows:
# Download from https://www.python.org/downloads/
```

#### pip not found

```bash
# Try pip3 instead
pip3 install pypdf

# Or install pip
# macOS/Linux:
python3 -m ensurepip --upgrade

# Windows:
python -m ensurepip --upgrade
```

#### Permission denied

```bash
# Use user installation
pip install --user pypdf

# Or use sudo (Linux/macOS)
sudo pip install pypdf
```

### Optional: Virtual Environment

For isolated Python environment:

```bash
# Create virtual environment
python3 -m venv ~/.mcp-python-env

# Activate it
source ~/.mcp-python-env/bin/activate  # macOS/Linux
# or
~/.mcp-python-env/Scripts/activate  # Windows

# Install pypdf
pip install pypdf

# To use in MCP, you may need to update the Python path
# in the server.mjs to point to the venv Python
```

## Usage

Once installed, both document tools are available in your MCP server:

### Read PDF

```javascript
{
  "name": "read-pdf",
  "arguments": {
    "filePath": "/absolute/path/to/document.pdf",
    "format": "markdown"  // or "text"
  }
}
```

### Read Word Document

```javascript
{
  "name": "read-docx",
  "arguments": {
    "filePath": "/absolute/path/to/document.docx",
    "format": "markdown"  // or "text"
  }
}
```

See [docs/PDF-TOOLS.md](docs/PDF-TOOLS.md) for complete documentation.
