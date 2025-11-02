#!/usr/bin/env python3
"""
PDF Maker Script for knowing-mcp
Converts Markdown files to PDF format
"""

import argparse
import json
import sys
import subprocess
from pathlib import Path

# Check for available PDF generation methods
PANDOC_AVAILABLE = False
WEASYPRINT_AVAILABLE = False
MARKDOWN_AVAILABLE = False

# Check for pandoc (preferred method - high quality)
try:
    subprocess.run(['pandoc', '--version'], capture_output=True, check=True)
    PANDOC_AVAILABLE = True
except (subprocess.CalledProcessError, FileNotFoundError):
    pass

# Check for weasyprint (fallback - good quality)
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except ImportError:
    pass

# Check for markdown library (for HTML conversion)
try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    pass


def make_pdf_with_pandoc(md_path, pdf_path, options=None):
    """
    Convert Markdown to PDF using pandoc (highest quality)
    
    Args:
        md_path (Path): Path to markdown file
        pdf_path (Path): Output PDF path
        options (dict): Additional options
        
    Returns:
        dict: Result dictionary
    """
    try:
        # Get styling options
        font_family = options.get('fontFamily', 'Helvetica, Arial, sans-serif') if options else 'Helvetica, Arial, sans-serif'
        line_height = options.get('lineHeight', '1.2') if options else '1.2'
        font_size = options.get('fontSize', '11pt') if options else '11pt'
        
        # First try to create HTML and then convert to PDF using weasyprint
        # This is more reliable than pandoc's direct PDF output which requires LaTeX
        
        # Create HTML with pandoc
        html_path = pdf_path.with_suffix('.html')
        cmd = ['pandoc', str(md_path), '-o', str(html_path), '--standalone']
        
        # Add options for HTML generation
        if options:
            # Include table of contents
            if options.get('toc', False):
                cmd.append('--toc')
            
            # Syntax highlighting
            if options.get('highlight', True):
                cmd.extend(['--highlight-style', 'tango'])
        
        # Run pandoc to create HTML
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"Pandoc HTML conversion failed: {result.stderr}",
                "method": "pandoc"
            }
        
        # Now convert HTML to PDF using weasyprint if available
        if WEASYPRINT_AVAILABLE:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Inject our custom CSS into the HTML
                # Get margin setting from options
                margin = options.get('margin', '2.5cm') if options else '2.5cm'
                paper_size = options.get('paperSize', 'A4').upper() if options else 'A4'
                
                custom_css = f"""
                <style>
                    @page {{
                        size: {paper_size};
                        margin: {margin};
                        @bottom-center {{
                            content: counter(page);
                            font-size: {font_size};
                            color: #333;
                            font-family: {font_family};
                        }}
                    }}
                    
                    body {{ 
                        font-family: {font_family} !important; 
                        font-size: {font_size} !important;
                        color: #333 !important;
                    }}
                    
                    body, body * {{
                        line-height: {line_height} !important;
                    }}
                    
                    h1, h2, h3, h4, h5, h6 {{
                        line-height: 1.2 !important;
                    }}
                    
                    h1 {{ 
                        color: #000 !important; 
                        border-bottom: 2px solid #333 !important; 
                        padding-bottom: 0.3em !important;
                        margin-top: 1.5em !important;
                        margin-bottom: 0.5em !important;
                        font-size: 2.5em !important;
                        font-weight: bold !important;
                    }}
                    
                    h2 {{ 
                        color: #333 !important; 
                        border-bottom: 1px solid #666 !important; 
                        padding-bottom: 0.2em !important;
                        margin-top: 1.2em !important;
                        margin-bottom: 0.4em !important;
                        font-size: 2em !important;
                        font-weight: bold !important;
                    }}
                    
                    h3 {{ 
                        color: #444 !important;
                        margin-top: 1em !important;
                        margin-bottom: 0.3em !important;
                        font-size: 1.5em !important;
                        font-weight: bold !important;
                    }}
                    
                    h4 {{
                        color: #555 !important;
                        margin-top: 0.8em !important;
                        margin-bottom: 0.3em !important;
                        font-size: 1.25em !important;
                        font-weight: bold !important;
                    }}
                    
                    h5 {{
                        color: #666 !important;
                        margin-top: 0.6em !important;
                        margin-bottom: 0.2em !important;
                        font-size: 1.1em !important;
                        font-weight: bold !important;
                    }}
                    
                    h6 {{
                        color: #777 !important;
                        margin-top: 0.6em !important;
                        margin-bottom: 0.2em !important;
                        font-size: 1em !important;
                        font-weight: bold !important;
                    }}
                    
                    p {{
                        margin-bottom: 0.8em !important;
                        line-height: {line_height} !important;
                    }}
                    
                    ul, ol {{
                        line-height: {line_height} !important;
                    }}
                    
                    li {{
                        line-height: {line_height} !important;
                    }}
                    
                    table {{
                        line-height: {line_height} !important;
                    }}
                </style>
                """
                
                # Insert custom CSS before </head>
                if '</head>' in html_content:
                    html_content = html_content.replace('</head>', f'{custom_css}</head>')
                else:
                    # If no </head>, add it at the beginning
                    html_content = custom_css + html_content
                
                weasyprint.HTML(string=html_content).write_pdf(str(pdf_path))
                
                # Clean up temporary HTML file
                html_path.unlink()
                
                return {
                    "success": True,
                    "pdfPath": str(pdf_path),
                    "pdfSize": pdf_path.stat().st_size,
                    "method": "pandoc+weasyprint"
                }
            except Exception as e:
                # If weasyprint fails, return the HTML file instead
                return {
                    "success": True,
                    "pdfPath": str(html_path),
                    "pdfSize": html_path.stat().st_size,
                    "method": "pandoc (HTML only)",
                    "note": f"PDF conversion failed ({str(e)}), HTML file created instead. You can open it in a browser and print to PDF."
                }
        else:
            # No weasyprint, just return HTML
            return {
                "success": True,
                "pdfPath": str(html_path),
                "pdfSize": html_path.stat().st_size,
                "method": "pandoc (HTML only)",
                "note": "WeasyPrint not available. HTML file created instead. You can open it in a browser and print to PDF, or install weasyprint: pip install weasyprint"
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Pandoc error: {str(e)}",
            "method": "pandoc"
        }


def make_pdf_with_weasyprint(md_path, pdf_path, options=None):
    """
    Convert Markdown to PDF using weasyprint
    
    Args:
        md_path (Path): Path to markdown file
        pdf_path (Path): Output PDF path
        options (dict): Additional options
        
    Returns:
        dict: Result dictionary
    """
    try:
        # Read markdown file
        with open(md_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convert markdown to HTML
        html_content = markdown.markdown(
            md_content,
            extensions=['extra', 'codehilite', 'tables', 'toc']
        )
        
        # Get options with defaults
        font_family = options.get('fontFamily', 'Helvetica, Arial, sans-serif') if options else 'Helvetica, Arial, sans-serif'
        line_height = options.get('lineHeight', '1.5') if options else '1.5'
        font_size = options.get('fontSize', '11pt') if options else '11pt'
        # Always use 2.5cm margin
        margin = '2.5cm'
        paper_size = options.get('paperSize', 'A4') if options else 'A4'
        
        # Add CSS styling with page numbers and custom fonts
        css_style = f"""
        <style>
            @page {{
                size: {paper_size};
                margin: {margin};
                @bottom-center {{
                    content: counter(page);
                    font-size: {font_size};
                    color: #333;
                    font-family: {font_family};
                }}
            }}
            
            html {{
                line-height: {line_height};
            }}
            
            body {{ 
                font-family: {font_family}; 
                font-size: {font_size};
                color: #333;
                line-height: {line_height};
            }}
            
            body * {{
                line-height: {line_height};
            }}
            
            h1, h2, h3, h4, h5, h6 {{
                color: #333;
                line-height: {line_height};
            }}
            
            h1 {{ 
                border-bottom: 2px solid #333; 
                padding-bottom: 0.3em;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-size: 2.5em;
                font-weight: bold;
            }}
            
            h2 {{ 
                border-bottom: 1px solid #666; 
                padding-bottom: 0.2em;
                margin-top: 1.2em;
                margin-bottom: 0.4em;
                font-size: 2em;
                font-weight: bold;
            }}
            
            h3 {{ 
                margin-top: 1em;
                margin-bottom: 0.3em;
                font-size: 1.5em;
                font-weight: bold;
            }}
            
            h4 {{
                margin-top: 0.8em;
                margin-bottom: 0.3em;
                font-size: 1.25em;
                font-weight: bold;
            }}
            
            h5 {{
                margin-top: 0.6em;
                margin-bottom: 0.2em;
                font-size: 1.1em;
                font-weight: bold;
            }}
            
            h6 {{
                margin-top: 0.6em;
                margin-bottom: 0.2em;
                font-size: 1em;
                font-weight: bold;
            }}
            
            p {{
                margin-bottom: 0.8em;
                line-height: {line_height};
            }}
            
            p, li, td, th, div, span, blockquote {{
                line-height: {line_height};
            }}
            
            code {{ 
                background-color: #f4f4f4; 
                padding: 2px 5px; 
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }}
            
            pre {{ 
                background-color: #f8f8f8; 
                padding: 12px; 
                border-radius: 4px; 
                overflow-x: auto;
                border: 1px solid #ddd;
                margin: 1em 0;
            }}
            
            pre code {{
                background-color: transparent;
                padding: 0;
            }}
            
            table {{ 
                border-collapse: collapse; 
                width: 100%;
                margin: 1em 0;
            }}
            
            th, td {{ 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
            }}
            
            th {{ 
                background-color: #f2f2f2; 
                font-weight: bold;
            }}
            
            ul, ol {{
                margin: 0.5em 0;
                padding-left: 2em;
            }}
            
            li {{
                margin-bottom: 0.3em;
            }}
            
            blockquote {{
                border-left: 4px solid #ddd;
                margin: 1em 0;
                padding-left: 1em;
                color: #666;
                font-style: italic;
            }}
            
            a {{
                color: #0066cc;
                text-decoration: none;
            }}
            
            a:hover {{
                text-decoration: underline;
            }}
        </style>
        """
        
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            {css_style}
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Convert HTML to PDF
        weasyprint.HTML(string=full_html).write_pdf(str(pdf_path))
        
        return {
            "success": True,
            "pdfPath": str(pdf_path),
            "pdfSize": pdf_path.stat().st_size,
            "method": "weasyprint"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"WeasyPrint error: {str(e)}",
            "method": "weasyprint"
        }


def make_pdf(md_file, pdf_file=None, method='auto', options=None):
    """
    Convert Markdown file to PDF
    
    Args:
        md_file (str): Path to markdown file
        pdf_file (str): Output PDF path (optional, defaults to same name as MD)
        method (str): Conversion method ('auto', 'pandoc', 'weasyprint')
        options (dict): Additional conversion options
        
    Returns:
        dict: Result dictionary
    """
    try:
        md_path = Path(md_file)
        
        # Validate input file
        if not md_path.exists():
            return {
                "success": False,
                "error": f"Markdown file not found: {md_path}"
            }
        
        if not md_path.suffix.lower() in ['.md', '.markdown']:
            return {
                "success": False,
                "error": f"File is not a Markdown file: {md_path}"
            }
        
        # Determine output path
        if pdf_file:
            pdf_path = Path(pdf_file)
        else:
            pdf_path = md_path.with_suffix('.pdf')
        
        # Ensure output directory exists
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Choose method
        if method == 'auto':
            # Prefer weasyprint for better CSS control
            if WEASYPRINT_AVAILABLE and MARKDOWN_AVAILABLE:
                method = 'weasyprint'
            elif PANDOC_AVAILABLE:
                method = 'pandoc'
            else:
                return {
                    "success": False,
                    "error": "No PDF conversion method available. Install weasyprint or pandoc.\n"
                            "- WeasyPrint (recommended): pip install weasyprint markdown\n"
                            "- Pandoc: https://pandoc.org/installing.html"
                }
        
        # Convert using selected method
        if method == 'pandoc':
            if not PANDOC_AVAILABLE:
                return {
                    "success": False,
                    "error": "Pandoc not available. Install from https://pandoc.org/installing.html"
                }
            return make_pdf_with_pandoc(md_path, pdf_path, options)
        
        elif method == 'weasyprint':
            if not WEASYPRINT_AVAILABLE:
                return {
                    "success": False,
                    "error": "WeasyPrint not available. Install: pip install weasyprint markdown"
                }
            if not MARKDOWN_AVAILABLE:
                return {
                    "success": False,
                    "error": "Python markdown library not available. Install: pip install markdown"
                }
            return make_pdf_with_weasyprint(md_path, pdf_path, options)
        
        else:
            return {
                "success": False,
                "error": f"Unknown method: {method}. Use 'auto', 'pandoc', or 'weasyprint'"
            }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(description='Convert Markdown to PDF')
    parser.add_argument('md_file', help='Path to markdown file')
    parser.add_argument('--output', '-o', help='Output PDF path (optional)')
    parser.add_argument('--method', choices=['auto', 'pandoc', 'weasyprint'],
                       default='auto', help='Conversion method (default: auto)')
    parser.add_argument('--toc', action='store_true', help='Include table of contents (pandoc only)')
    parser.add_argument('--engine', help='PDF engine for pandoc (e.g., xelatex, wkhtmltopdf)')
    parser.add_argument('--paper-size', help='Paper size (e.g., a4, letter)')
    parser.add_argument('--margin', help='Page margin (e.g., 1in, 2cm)')
    parser.add_argument('--font-family', help='Font family (e.g., "Georgia, serif", "Arial, sans-serif")')
    parser.add_argument('--line-height', help='Line height (e.g., 1.6, 1.8, 2.0)')
    parser.add_argument('--font-size', help='Font size (e.g., 10pt, 11pt, 12pt)')
    
    args = parser.parse_args()
    
    # Build options
    options = {}
    if args.toc:
        options['toc'] = True
    if args.engine:
        options['engine'] = args.engine
    if args.paper_size:
        options['paperSize'] = args.paper_size
    if args.margin:
        options['margin'] = args.margin
    if args.font_family:
        options['fontFamily'] = args.font_family
    if args.line_height:
        options['lineHeight'] = args.line_height
    if args.font_size:
        options['fontSize'] = args.font_size
    
    result = make_pdf(args.md_file, args.output, args.method, options)
    
    print(json.dumps(result, indent=2))
    
    if not result['success']:
        sys.exit(1)


if __name__ == '__main__':
    main()
