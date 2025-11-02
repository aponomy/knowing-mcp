#!/usr/bin/env python3
"""
PDF Reader Script for knowing-mcp
Reads PDF files and converts them to text or markdown format
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import pypdf
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "pypdf library not installed. Run: pip install pypdf"
    }))
    sys.exit(1)

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False


def read_pdf_to_text(pdf_path):
    """
    Read PDF file and extract text content
    
    Args:
        pdf_path (str): Path to PDF file
        
    Returns:
        dict: Dictionary containing success status, text content, and metadata
    """
    try:
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            return {
                "success": False,
                "error": f"PDF file not found: {pdf_path}"
            }
        
        if not pdf_path.suffix.lower() == '.pdf':
            return {
                "success": False,
                "error": f"File is not a PDF: {pdf_path}"
            }
        
        # Read PDF
        reader = pypdf.PdfReader(str(pdf_path))
        
        # Extract metadata
        metadata = reader.metadata or {}
        meta_info = {
            "title": metadata.get('/Title', ''),
            "author": metadata.get('/Author', ''),
            "subject": metadata.get('/Subject', ''),
            "creator": metadata.get('/Creator', ''),
            "producer": metadata.get('/Producer', ''),
            "creation_date": str(metadata.get('/CreationDate', '')),
            "modification_date": str(metadata.get('/ModDate', '')),
        }
        
        # Extract text from all pages
        text_content = []
        page_count = len(reader.pages)
        
        for page_num, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text()
            if page_text.strip():
                text_content.append({
                    "page": page_num,
                    "text": page_text
                })
        
        # Combine all text
        full_text = "\n\n".join([f"--- Page {p['page']} ---\n{p['text']}" for p in text_content])
        
        return {
            "success": True,
            "file_path": str(pdf_path),
            "page_count": page_count,
            "metadata": meta_info,
            "text": full_text,
            "pages": text_content
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error reading PDF: {str(e)}"
        }


def read_pdf_to_markdown(pdf_path):
    """
    Read PDF file and convert to markdown format
    
    Args:
        pdf_path (str): Path to PDF file
        
    Returns:
        dict: Dictionary containing success status, markdown content, and metadata
    """
    result = read_pdf_to_text(pdf_path)
    
    if not result.get("success"):
        return result
    
    # Convert to markdown format
    markdown_lines = []
    
    # Add title if available
    if result["metadata"].get("title"):
        markdown_lines.append(f"# {result['metadata']['title']}\n")
    
    # Add metadata section
    markdown_lines.append("## Document Information\n")
    if result["metadata"].get("author"):
        markdown_lines.append(f"**Author:** {result['metadata']['author']}  ")
    if result["metadata"].get("subject"):
        markdown_lines.append(f"**Subject:** {result['metadata']['subject']}  ")
    markdown_lines.append(f"**Pages:** {result['page_count']}  ")
    if result["metadata"].get("creation_date"):
        markdown_lines.append(f"**Created:** {result['metadata']['creation_date']}  ")
    markdown_lines.append("\n---\n")
    
    # Add content by page
    markdown_lines.append("## Content\n")
    for page_data in result["pages"]:
        markdown_lines.append(f"\n### Page {page_data['page']}\n")
        markdown_lines.append(page_data['text'])
        markdown_lines.append("\n")
    
    markdown_content = "\n".join(markdown_lines)
    
    return {
        "success": True,
        "file_path": result["file_path"],
        "page_count": result["page_count"],
        "metadata": result["metadata"],
        "markdown": markdown_content,
        "text": result["text"]
    }


def main():
    parser = argparse.ArgumentParser(description='Read PDF files and extract text or markdown')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('--format', choices=['text', 'markdown'], default='markdown',
                        help='Output format (default: markdown)')
    parser.add_argument('--output', '-o', dest='output_path',
                        help='Save output to file instead of printing (useful for large documents)')
    parser.add_argument('--json', action='store_true',
                        help='Output as JSON (for programmatic use)')
    
    args = parser.parse_args()
    
    if args.format == 'markdown':
        result = read_pdf_to_markdown(args.pdf_path)
    else:
        result = read_pdf_to_text(args.pdf_path)
    
    if args.json:
        # If output path is specified, save to file and return file info
        if args.output_path and result.get("success"):
            try:
                output_path = Path(args.output_path)
                # Create directory if needed
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Save content to file
                content = result.get("markdown" if args.format == 'markdown' else "text", "")
                output_path.write_text(content, encoding='utf-8')
                
                # Update result to indicate file was saved
                result["saved_to_file"] = str(output_path)
                result["file_size"] = len(content)
                # Remove large content from JSON response
                if "markdown" in result:
                    del result["markdown"]
                if "text" in result:
                    del result["text"]
                
                print(json.dumps(result, indent=2))
            except Exception as e:
                result["success"] = False
                result["error"] = f"Failed to save to file: {str(e)}"
                print(json.dumps(result, indent=2))
                sys.exit(1)
        else:
            print(json.dumps(result, indent=2))
    else:
        if result.get("success"):
            content = result.get("markdown" if args.format == 'markdown' else "text", "")
            
            # Save to file if output path specified
            if args.output_path:
                try:
                    output_path = Path(args.output_path)
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_text(content, encoding='utf-8')
                    print(f"✅ Saved to: {output_path}")
                except Exception as e:
                    print(f"Error saving to file: {e}", file=sys.stderr)
                    sys.exit(1)
            else:
                print(content)
        else:
            print(f"Error: {result.get('error', 'Unknown error')}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
